import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON, MODEL } from "@/lib/ai/gemini";
import { GUIDE_SYSTEM, guideJsonSchema, guideZod, type GuideResult } from "@/lib/ai/schemas";
import { finishUsage, readCache, sha256, takeQuota, writeCache } from "@/lib/ai/usage";

export const maxDuration = 30;

// POST /api/guide  body: { ideaId }
// FR22 & NFR16: panduan dibuat HANYA saat ide dipilih, lalu disimpan & dipakai ulang
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (typeof body?.ideaId !== "string") return NextResponse.json({ error: "ideaId wajib" }, { status: 400 });

  const { data: idea } = await supabase
    .from("ideas").select("id, title, materials, tools, extras, guide").eq("id", body.ideaId).maybeSingle();
  if (!idea) return NextResponse.json({ error: "Ide tidak ditemukan" }, { status: 404 });
  if (idea.guide) return NextResponse.json({ guide: idea.guide, cached: true });

  // Cache lintas kelompok untuk kombinasi produk + bahan yang sama
  const cacheKey = `guide:v1:${sha256(idea.title + JSON.stringify(idea.materials))}`;
  let guide = await readCache<GuideResult>(supabase, cacheKey);

  if (!guide) {
    const quota = await takeQuota(supabase, "guide", MODEL);
    if (!quota.usageId) return NextResponse.json({ error: quota.error }, { status: 429 });
    try {
      const out = await generateJSON<GuideResult>({
        system: GUIDE_SYSTEM,
        parts: [{
          text: `Produk: ${idea.title}. Bahan per unit: ${JSON.stringify(idea.materials)}. ` +
                `Alat: ${JSON.stringify(idea.tools)}. Bahan tambahan: ${JSON.stringify(idea.extras)}.`,
        }],
        jsonSchema: guideJsonSchema,
        schema: guideZod,
        maxOutputTokens: 3072,
        timeoutMs: 15_000,
      });
      guide = out.data;
      await finishUsage(supabase, quota.usageId, out.tokensIn, out.tokensOut, true);
      await writeCache(supabase, cacheKey, "guide", guide);
    } catch {
      await finishUsage(supabase, quota.usageId, 0, 0, false);
      return NextResponse.json({ error: "AI belum bisa membuat panduan. Coba lagi nanti." }, { status: 502 });
    }
  }

  await supabase.rpc("save_idea_guide", { p_idea_id: idea.id, p_guide: guide });
  return NextResponse.json({ guide, cached: false });
}
