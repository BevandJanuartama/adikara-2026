import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DepositWizard } from "./deposit-wizard";

export default async function SetoranBaruPage() {
  const me = await requireMe(["pengurus"]);
  const supabase = await createClient();
  const [{ data: residents }, { data: prices }] = await Promise.all([
    supabase.from("residents").select("id, name, balance").order("name"),
    supabase.from("price_table").select("item_type, price_per_kg").eq("is_active", true).order("item_type"),
  ]);

  return (
    <DepositWizard
      groupId={me.group!.id}
      residents={(residents ?? []).map((r) => ({ id: r.id, name: r.name, balance: Number(r.balance) }))}
      prices={(prices ?? []).map((p) => ({ item_type: p.item_type, price_per_kg: Number(p.price_per_kg) }))}
    />
  );
}
