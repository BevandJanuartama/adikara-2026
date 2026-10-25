import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON, MODEL } from "@/lib/ai/gemini";
import { IDEA_SYSTEM, ideaJsonSchema, ideaZod, type IdeaResult } from "@/lib/ai/schemas";
import { finishUsage, readCache, sha256, takeQuota, writeCache } from "@/lib/ai/usage";
import { friendlyError } from "@/lib/errors";

export const maxDuration = 30;

// POST /api/ideas  body: { force?: boolean }
// FR18: ringkasan stok pendek → cache → kuota → Gemini → simpan ide (costing dihitung di database)
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const force = body?.force === true;

  // 1. Ringkasan stok pendek (NFR15), dibulatkan ke kg → ide hanya dibuat ulang bila stok berubah berarti
  const { data: stock } = await supabase
    .from("stock").select("item_type, qty_kg").gt("qty_kg", 0.2).order("item_type");
  if (!stock?.length) return NextResponse.json({ error: "Stok masih kosong", manual: true }, { status: 400 });
  const summary = stock.map((s) => `${s.item_type} ${Math.round(Number(s.qty_kg))} kg`).join("; ");
  const stockHash = sha256(summary);
  const cacheKey = `idea:v1:${stockHash}`;

  // 2. Sudah pernah dibuat untuk stok yang sama? pakai ulang (kecuali pengguna minta ulang)
  if (!force) {
    const { data: existing } = await supabase.from("ideas").select("id").eq("stock_hash", stockHash).limit(1);
    if (existing?.length) return NextResponse.json({ cached: true, created: 0 });
  }

  let ideas: IdeaResult["ideas"] | null = force ? null : (await readCache<IdeaResult>(supabase, cacheKey))?.ideas ?? null;
  const fromCache = !!ideas;

  if (!ideas) {
    const quota = await takeQuota(supabase, "idea", MODEL);
    if (!quota.usageId) return NextResponse.json({ error: quota.error, manual: true }, { status: 429 });
    try {
      const out = await generateJSON<IdeaResult>({
        system: IDEA_SYSTEM,
        parts: [{ text: `Stok posko: ${summary}.` }],
        jsonSchema: ideaJsonSchema(stock.map((s) => s.item_type as string)),
        schema: ideaZod,
        maxOutputTokens: 3072,
        timeoutMs: 14_000,
      });
      ideas = out.data.ideas;
      await finishUsage(supabase, quota.usageId, out.tokensIn, out.tokensOut, true);
      await writeCache(supabase, cacheKey, "idea", out.data);
    } catch {
      await finishUsage(supabase, quota.usageId, 0, 0, false);
      return NextResponse.json(
        { error: "AI belum bisa membuat ide. Pilih dari template ide.", manual: true },
        { status: 502 },
      );
    }
  }

  // 3. Simpan ke tabel ideas lewat RPC (modal, upah, harga jual dihitung di database)
  let created = 0;
  for (const idea of ideas) {
    const { error } = await supabase.rpc("create_idea", {
      p: { ...idea, source: "ai", stock_hash: stockHash, tool_cost: 500 },
    });
    if (error) console.error("[create_idea]", friendlyError(error.message));
    else created++;
  }
  return NextResponse.json({ cached: fromCache, created });
}
