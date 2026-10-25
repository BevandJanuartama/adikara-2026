"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import type { ActionResult } from "@/lib/types";

// NFR07: validasi input di server dengan Zod
const residentSchema = z.object({
  name: z.string().trim().min(2, "Nama warga minimal 2 huruf").max(80),
  phone: z.string().trim().max(20).optional(),
});

export async function createResident(input: z.input<typeof residentSchema>): Promise<ActionResult<{ id: string; name: string; balance: number }>> {
  const parsed = residentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("residents")
    .insert({ name: parsed.data.name, phone: parsed.data.phone || null })
    .select("id, name, balance")
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/warga");
  return { ok: true, data: { id: data.id, name: data.name, balance: Number(data.balance) } };
}

const depositSchema = z.object({
  residentId: z.string().min(1, "Pilih warga dulu"),
  photoPath: z.string().nullable(),
  photoHash: z.string().nullable(),
  aiResult: z.unknown().nullable(),
  items: z
    .array(
      z.object({
        item_type: z.string().min(1),
        condition: z.enum(["bersih", "kotor", "rusak"]),
        is_eligible: z.boolean(),
        weight_kg: z.number().positive("Berat harus lebih dari 0").max(1000),
        ai_suggested: z.boolean(),
        reason: z.string().max(200).optional(),
      }),
    )
    .min(1, "Tambahkan minimal satu barang")
    .max(20),
});

// FR10: simpan setoran draft (harga & total dihitung database dari tabel harga)
export async function createDeposit(input: z.input<typeof depositSchema>): Promise<ActionResult<{ depositId: string; total: number }>> {
  const parsed = depositSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data setoran tidak valid" };
  const { residentId, items, photoPath, photoHash, aiResult } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_deposit", {
    p_resident_id: residentId,
    p_items: items,
    p_photo_path: photoPath,
    p_photo_hash: photoHash,
    p_ai_result: aiResult ?? null,
  });
  if (error) return { ok: false, error: friendlyError(error.message) };
  const res = data as { deposit_id: string; total: number };
  return { ok: true, data: { depositId: res.deposit_id, total: Number(res.total) } };
}

// FR11–FR12: persetujuan warga → saldo/kas + stok (atomik di database)
export async function approveDeposit(depositId: string, payCash: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_deposit", { p_deposit_id: depositId, p_pay_cash: payCash });
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/setoran");
  revalidatePath("/stok");
  revalidatePath("/beranda");
  return { ok: true, data: null };
}

export async function cancelDeposit(depositId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_deposit", { p_deposit_id: depositId });
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/setoran");
  return { ok: true, data: null };
}
