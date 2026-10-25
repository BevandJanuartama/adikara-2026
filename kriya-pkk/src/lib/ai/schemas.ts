import { z } from "zod";

// ---------- SCAN (FR08) ----------
export const scanZod = z.object({
  items: z
    .array(
      z.object({
        item_type: z.string(),
        condition: z.enum(["bersih", "kotor", "rusak"]),
        is_eligible: z.boolean(),
        reason: z.string().max(200),
      }),
    )
    .max(10),
  note: z.string().max(200).optional(),
});
export type ScanResult = z.infer<typeof scanZod>;

// JSON Schema untuk Gemini (enum jenis barang = isi tabel harga kelompok + "Lainnya")
export function scanJsonSchema(itemTypes: string[]) {
  return {
    type: "object",
    properties: {
      items: {
        type: "array",
        maxItems: 10,
        items: {
          type: "object",
          properties: {
            item_type: { type: "string", enum: [...itemTypes, "Lainnya"] },
            condition: { type: "string", enum: ["bersih", "kotor", "rusak"] },
            is_eligible: { type: "boolean" },
            reason: { type: "string", description: "Alasan singkat, maksimal 12 kata" },
          },
          required: ["item_type", "condition", "is_eligible", "reason"],
        },
      },
      note: { type: "string" },
    },
    required: ["items"],
  };
}

export const SCAN_SYSTEM = `Kamu pemeriksa barang setoran sampah anorganik di posko PKK.
Kenali setiap JENIS barang yang terlihat di foto. Gabungkan barang sejenis jadi satu baris.
Kondisi: bersih, kotor (masih bisa dicuci), rusak.
is_eligible=false untuk barang berbahaya atau tidak bisa diolah: pecahan kaca, logam tajam/berkarat parah,
wadah bekas bahan kimia/oli/pestisida, sampah organik/makanan, popok, barang medis.
Jangan menaksir berat atau harga. Jawab hanya JSON sesuai skema, alasan singkat dalam bahasa Indonesia.`;

// ---------- IDE (FR18–FR19) ----------
export const ideaZod = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string().min(3).max(80),
        description: z.string().max(240),
        materials: z.array(z.object({ item_type: z.string(), kg: z.number().positive().max(20) })).min(1).max(4),
        tools: z.array(z.string().max(40)).max(8),
        extras: z.array(z.object({ name: z.string().max(60), price: z.number().min(0).max(200000) })).max(6),
        time_hours: z.number().positive().max(24),
        difficulty: z.enum(["mudah", "sedang", "sulit"]),
      }),
    )
    .min(1)
    .max(3),
});
export type IdeaResult = z.infer<typeof ideaZod>;

export function ideaJsonSchema(itemTypes: string[]) {
  return {
    type: "object",
    properties: {
      ideas: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string", description: "1-2 kalimat" },
            materials: {
              type: "array",
              description: "Bahan dari stok untuk 1 unit produk",
              items: {
                type: "object",
                properties: {
                  item_type: { type: "string", enum: itemTypes },
                  kg: { type: "number", description: "kg per 1 unit" },
                },
                required: ["item_type", "kg"],
              },
            },
            tools: { type: "array", items: { type: "string" } },
            extras: {
              type: "array",
              description: "Bahan tambahan yang dibeli di warung untuk 1 unit",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number", description: "perkiraan harga Rupiah per unit" },
                },
                required: ["name", "price"],
              },
            },
            time_hours: { type: "number", description: "waktu kerja 1 unit dalam jam" },
            difficulty: { type: "string", enum: ["mudah", "sedang", "sulit"] },
          },
          required: ["title", "description", "materials", "tools", "extras", "time_hours", "difficulty"],
        },
      },
    },
    required: ["ideas"],
  };
}

export const IDEA_SYSTEM = `Kamu penasihat produksi kerajinan daur ulang untuk ibu-ibu PKK di Indonesia.
Buat maksimal 3 ide produk yang laku dijual di kampung/bazar, bisa dibuat dengan alat rumah tangga sederhana.
Bahan utama HANYA dari daftar stok yang diberikan, dengan kebutuhan kg per 1 unit yang realistis.
Bahan tambahan = barang murah yang mudah dibeli di warung, harga perkiraan dalam Rupiah.
Jangan menghitung modal atau harga jual. Jawab hanya JSON sesuai skema.`;

// ---------- PANDUAN (FR22) ----------
export const guideZod = z.object({
  persiapan: z.array(z.string()).max(8),
  langkah: z.array(z.string()).min(3).max(12),
  tips: z.array(z.string()).max(5),
  keselamatan: z.array(z.string()).max(5),
});
export type GuideResult = z.infer<typeof guideZod>;

export const guideJsonSchema = {
  type: "object",
  properties: {
    persiapan: { type: "array", items: { type: "string" } },
    langkah: { type: "array", items: { type: "string" }, description: "Langkah berurutan, kalimat pendek" },
    tips: { type: "array", items: { type: "string" } },
    keselamatan: { type: "array", items: { type: "string" } },
  },
  required: ["persiapan", "langkah", "tips", "keselamatan"],
};

export const GUIDE_SYSTEM = `Kamu pelatih kerajinan untuk ibu-ibu PKK. Tulis panduan membuat produk langkah demi langkah,
kalimat pendek dan jelas (bisa dibacakan dengan suara), bahasa Indonesia sehari-hari.
Sertakan catatan keselamatan bila memakai benda tajam, panas, atau lem. Jawab hanya JSON sesuai skema.`;
