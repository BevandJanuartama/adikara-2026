"use server";

// Server Action khusus admin platform: catatan pencairan dana pembayaran online ke posko.
import { revalidatePath } from "next/cache";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { parseDecimal, rupiah } from "@/lib/format";

type FormState = { error?: string; message?: string } | undefined;
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function recordPayout(groupId: string, _p: FormState, fd: FormData): Promise<FormState> {
  await requireMe(["admin"]);
  const amount = Math.round(parseDecimal(str(fd, "amount")));
  const fee = Math.round(parseDecimal(str(fd, "fee")));
  const paidOn = str(fd, "paid_on");
  if (amount <= 0) return { error: "Jumlah yang ditransfer harus lebih dari 0" };
  if (fee < 0) return { error: "Potongan biaya tidak boleh negatif" };
  if (paidOn && !/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) return { error: "Tanggal tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_record_payout", {
    p_group_id: groupId,
    p_amount: amount,
    p_fee: fee,
    p_reference: str(fd, "reference") || null,
    p_note: str(fd, "note") || null,
    p_paid_on: paidOn || null,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/pencairan");
  return { message: `Pencairan ${rupiah(amount)} tercatat. Posko melihatnya di menu Pesanan online.` };
}

export async function deletePayout(id: string, _p: FormState, _fd: FormData): Promise<FormState> {
  await requireMe(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_payout", { p_id: id });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/pencairan");
  return { message: "Catatan pencairan dihapus." };
}
