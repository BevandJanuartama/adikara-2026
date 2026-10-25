import "server-only";
import { createHash } from "node:crypto";
import type { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const sha256 = (input: string | Buffer) => createHash("sha256").update(input).digest("hex");

// FR35: baca cache dulu sebelum memanggil AI
export async function readCache<T>(supabase: SupabaseClient, key: string): Promise<T | null> {
  const { data } = await supabase.from("ai_cache").select("result").eq("hash", key).maybeSingle();
  return (data?.result as T) ?? null;
}

export async function writeCache(supabase: SupabaseClient, key: string, fn: "scan" | "idea" | "guide", result: unknown) {
  const { error } = await supabase.from("ai_cache").insert({ hash: key, fn, result });
  if (error && error.code !== "23505") console.error("[ai_cache]", error.message); // 23505 = sudah ada
}

// FR33: ambil jatah kuota; null + pesan bila habis
export async function takeQuota(supabase: SupabaseClient, fn: "scan" | "idea" | "guide", model: string) {
  const { data, error } = await supabase.rpc("consume_ai_quota", { p_fn: fn, p_model: model });
  if (error) return { usageId: null, error: friendlyError(error.message) };
  return { usageId: data as number, error: null };
}

export async function finishUsage(
  supabase: SupabaseClient, usageId: number, tokensIn: number, tokensOut: number, ok: boolean,
) {
  await supabase.rpc("finish_ai_usage", {
    p_usage_id: usageId, p_tokens_in: tokensIn, p_tokens_out: tokensOut, p_ok: ok,
  });
}
