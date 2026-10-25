import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";

// Model diatur lewat env supaya mudah diganti tanpa ubah kode.
// Cek daftar model aktif: https://ai.google.dev/gemini-api/docs/deprecations
export const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const FALLBACK = process.env.GEMINI_MODEL_FALLBACK || "gemini-3.8-flash";

let client: GoogleGenAI | null = null;
const ai = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }));

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

export type AiOutput<T> = { data: T; model: string; tokensIn: number; tokensOut: number };

// NFR09 & NFR17: keluaran JSON berskema + batas token + timeout + 1x ulang (pakai model cadangan).
// Jika tetap gagal → lempar error → route API membalas { manual: true } (FR34).
export async function generateJSON<T>(opts: {
  system: string;
  parts: Part[];
  jsonSchema: object;
  schema: ZodType<T>;
  maxOutputTokens?: number;
  timeoutMs?: number;
}): Promise<AiOutput<T>> {
  const models = Array.from(new Set([MODEL, FALLBACK].filter(Boolean)));
  let lastError: unknown;

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 12_000);
    try {
      const res = await ai().models.generateContent({
        model,
        contents: [{ role: "user", parts: opts.parts }],
        config: {
          systemInstruction: opts.system,
          responseMimeType: "application/json",
          responseJsonSchema: opts.jsonSchema,
          maxOutputTokens: opts.maxOutputTokens ?? 2048,
          abortSignal: controller.signal,
          // Jika respons terasa lambat, coba tambahkan (lihat dokumentasi "thinking" Gemini):
          // thinkingConfig: { thinkingLevel: "low" },
        },
      });
      const parsed = opts.schema.safeParse(JSON.parse(res.text ?? ""));
      if (!parsed.success) throw new Error("Format jawaban AI tidak sesuai skema");
      const u = res.usageMetadata;
      return {
        data: parsed.data,
        model,
        tokensIn: u?.promptTokenCount ?? 0,
        tokensOut: (u?.candidatesTokenCount ?? 0) + (u?.thoughtsTokenCount ?? 0),
      };
    } catch (err) {
      lastError = err;
      console.error(`[gemini] ${model} gagal:`, err instanceof Error ? err.message : err);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("AI gagal");
}
