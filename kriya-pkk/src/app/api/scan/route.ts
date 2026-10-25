import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON, MODEL } from "@/lib/ai/gemini";
import { SCAN_SYSTEM, scanJsonSchema, scanZod, type ScanResult } from "@/lib/ai/schemas";
import { finishUsage, readCache, sha256, takeQuota, writeCache } from "@/lib/ai/usage";

export const maxDuration = 30; // detik (batas fungsi Vercel)

// POST /api/scan  body: { path: "<group_id>/deposits/xxx.jpg" }
// Alur: auth → unduh foto (RLS storage) → cache → kuota → Gemini Vision → validasi → cache
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const path: unknown = body?.path;
  if (typeof path !== "string" || !path.includes("/deposits/")) {
    return NextResponse.json({ error: "Path foto tidak valid" }, { status: 400 });
  }

  // 1. Unduh foto. Policy storage menjamin hanya foto kelompok sendiri yang bisa dibaca.
  const { data: file, error: dlError } = await supabase.storage.from("photos").download(path);
  if (dlError || !file) return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > 1_000_000) return NextResponse.json({ error: "Foto terlalu besar" }, { status: 413 });

  // 2. Cache berdasarkan hash foto (FR35)
  const hash = sha256(bytes);
  const cacheKey = `scan:v1:${hash}`;
  const cached = await readCache<ScanResult>(supabase, cacheKey);
  if (cached) return NextResponse.json({ ...cached, hash, cached: true });

  // 3. Jenis barang yang dikenali = tabel harga kelompok
  const { data: prices } = await supabase.from("price_table").select("item_type").eq("is_active", true);
  const itemTypes = (prices ?? []).map((p) => p.item_type as string);
  if (itemTypes.length === 0) {
    return NextResponse.json({ error: "Tabel harga masih kosong", manual: true }, { status: 400 });
  }

  // 4. Kuota harian (FR33)
  const quota = await takeQuota(supabase, "scan", MODEL);
  if (!quota.usageId) return NextResponse.json({ error: quota.error, manual: true }, { status: 429 });

  // 5. Panggil AI
  try {
    const out = await generateJSON<ScanResult>({
      system: SCAN_SYSTEM,
      parts: [
        { inlineData: { mimeType: file.type || "image/jpeg", data: bytes.toString("base64") } },
        { text: "Periksa barang setoran pada foto ini." },
      ],
      jsonSchema: scanJsonSchema(itemTypes),
      schema: scanZod,
      maxOutputTokens: 1024,
    });
    // Jenis di luar tabel harga → tandai tidak layak agar pengurus memilih manual (FR09)
    const result: ScanResult = {
      ...out.data,
      items: out.data.items.map((it: ScanResult["items"][number]) =>
        itemTypes.includes(it.item_type)
          ? it
          : { ...it, item_type: "Lainnya", is_eligible: false, reason: it.reason || "Jenis belum ada di tabel harga" },
      ),
    };
    await finishUsage(supabase, quota.usageId, out.tokensIn, out.tokensOut, true);
    await writeCache(supabase, cacheKey, "scan", result);
    return NextResponse.json({ ...result, hash, cached: false });
  } catch {
    await finishUsage(supabase, quota.usageId, 0, 0, false);
    return NextResponse.json(
      { error: "AI belum bisa membaca foto. Silakan pilih jenis barang secara manual.", manual: true },
      { status: 502 },
    );
  }
}
