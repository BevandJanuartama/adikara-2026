import { ChevronDown, History, Landmark, Wallet } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";
import { ActionForm, Field } from "@/components/action-form";
import { Badge, EmptyState, MoneyRow, Notice, PageHeader, Panel, StatPatch } from "@/components/kriya-ui";
import { simulasiAktif } from "@/lib/marketplace/simulasi";
import { SalinTeks } from "@/components/toko/salin-teks";
import { deletePayout, recordPayout } from "@/lib/actions/admin";

type Ringkas = {
  group_id: string;
  name: string;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  online_total: number;
  simulasi_total: number;
  dicairkan: number;
  biaya: number;
  saldo: number;
  cair_terakhir: string | null;
};

type Riwayat = {
  id: string;
  amount: number;
  fee: number;
  reference: string | null;
  note: string | null;
  paid_on: string;
  posko: { name: string } | null;
};

// 0123456789 → 0123 4567 89 (lebih mudah dibaca saat transfer)
const formatRekening = (n: string | null | undefined) => (n ?? "").replace(/(\d{4})(?=\d)/g, "$1 ");
const hariIni = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

// Admin: dana pembayaran online (Midtrans) yang masuk ke rekening platform → dicairkan ke posko
export default async function PencairanPage() {
  await requireMe(["admin"]);
  const supabase = await createClient();
  const [{ data: ringkasRaw, error }, { data: riwayatRaw }] = await Promise.all([
    supabase.rpc("admin_saldo_posko"),
    supabase
      .from("platform_payouts")
      .select("id, amount, fee, reference, note, paid_on, posko:groups(name)")
      .order("paid_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const semua = (ringkasRaw ?? []) as Ringkas[];
  const perluCair = semua.filter((r) => Number(r.saldo) > 0);
  const lainnya = semua.filter((r) => Number(r.saldo) <= 0 && Number(r.online_total) > 0);
  const riwayat = (riwayatRaw ?? []) as unknown as Riwayat[];
  const totalSaldo = perluCair.reduce((s, r) => s + Number(r.saldo), 0);
  const totalCair = semua.reduce((s, r) => s + Number(r.dicairkan), 0);
  const simulasi = semua.reduce((s, r) => s + Number(r.simulasi_total), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pencairan dana"
        description="Pembayaran QRIS/VA masuk ke rekening Midtrans pengelola. Catat di sini setiap transfer ke rekening posko."
        icon={Wallet}
      />

      {error && <Notice tone="error">Gagal memuat data: {error.message}. Pastikan migrasi 0004_akun_pembeli sudah dijalankan.</Notice>}
      {(simulasiAktif() || simulasi > 0) && (
        <Notice tone="warning">
          Pembayaran simulasi{simulasi > 0 ? ` (${rupiah(simulasi)})` : ""} tidak dihitung sebagai dana karena tidak ada uang yang masuk.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StatPatch tone="persik" label="Harus dicairkan" value={rupiah(totalSaldo)} icon={Wallet} hint={`${perluCair.length} posko`} />
        <StatPatch tone="pucuk" label="Sudah dicairkan" value={rupiah(totalCair)} icon={History} />
        <StatPatch
          tone="mentega"
          label="Cara menghitung"
          value="Online − cair − biaya"
          className="col-span-2 xl:col-span-1"
          hint="Online = produk + ongkir (posko yang bayar ekspedisi)."
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-tinta">Posko dengan dana belum dicairkan</h2>
        {perluCair.length === 0 ? (
          <EmptyState icon={Wallet} title="Semua dana sudah dicairkan" text="Saldo posko muncul di sini setelah ada pembayaran online yang lunas." />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {perluCair.map((r) => (
              <KartuPosko key={r.group_id} r={r} />
            ))}
          </div>
        )}
      </section>

      {lainnya.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-tinta">Sudah lunas dicairkan</h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {lainnya.map((r) => (
              <li key={r.group_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-base">
                <span className="font-semibold text-tinta">{r.name}</span>
                <span className="text-sm text-muted-foreground">
                  {rupiah(r.dicairkan)} dicairkan{r.cair_terakhir ? ` · terakhir ${tanggal(r.cair_terakhir)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Panel title="Riwayat pencairan" icon={History} bodyClassName="p-0">
        {riwayat.length === 0 ? (
          <p className="p-5 text-base text-muted-foreground">Belum ada pencairan.</p>
        ) : (
          <ul className="divide-y">
            {riwayat.map((c) => (
              <li key={c.id} className="grid grid-cols-1 gap-2 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-4">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-tinta">
                    {c.posko?.name ?? "-"} <span className="font-normal text-muted-foreground">· {tanggal(c.paid_on)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[c.reference && `Ref. ${c.reference}`, Number(c.fee) > 0 && `biaya ${rupiah(c.fee)}`, c.note].filter(Boolean).join(" · ") || "-"}
                  </p>
                </div>
                <span className="text-base font-bold tabular-nums text-tinta">{rupiah(c.amount)}</span>
                <details className="group sm:col-span-2">
                  <summary className="w-fit cursor-pointer text-sm font-semibold text-bata-ink">Hapus catatan (bila salah input)</summary>
                  <ActionForm action={deletePayout.bind(null, c.id)} submitLabel="Ya, hapus catatan ini" variant="destructive" className="mt-2 space-y-2 sm:w-56" />
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function KartuPosko({ r }: { r: Ringkas }) {
  const punyaRekening = !!r.bank_account_no;
  return (
    <article className="flex flex-col rounded-2xl border bg-card">
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-lg font-bold text-tinta">{r.name}</p>
          <Badge tone="persik">{rupiah(r.saldo)}</Badge>
        </div>
        {punyaRekening ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-daun-muda/60 p-3">
            <p className="flex items-start gap-2 text-base text-tinta">
              <Landmark className="mt-0.5 size-5 shrink-0 text-hutan" aria-hidden />
              <span>
                {r.bank_name} <b className="tabular-nums">{formatRekening(r.bank_account_no)}</b>
                <span className="block text-sm text-muted-foreground">a.n. {r.bank_account_name}</span>
              </span>
            </p>
            <SalinTeks teks={r.bank_account_no ?? ""} label="Salin rekening" />
          </div>
        ) : (
          <Notice tone="warning">Posko belum mengisi rekening di Pengaturan posko. Hubungi pengurusnya dulu.</Notice>
        )}
        <div className="divide-y">
          <MoneyRow label="Pembayaran online lunas" value={rupiah(r.online_total)} />
          <MoneyRow label="Sudah dicairkan" value={`− ${rupiah(r.dicairkan)}`} />
          {Number(r.biaya) > 0 && <MoneyRow label="Potongan biaya" value={`− ${rupiah(r.biaya)}`} />}
          <MoneyRow label="Belum dicairkan" value={rupiah(r.saldo)} strong />
        </div>
      </div>
      <details className="group border-t" open={punyaRekening}>
        <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-base font-semibold text-hutan">
          Catat pencairan
          <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="border-t p-5">
          <ActionForm action={recordPayout.bind(null, r.group_id)} submitLabel="Simpan pencairan">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Jumlah ditransfer (Rp)" name="amount" type="number" min={1} defaultValue={Math.round(Number(r.saldo))} />
              <Field label="Potongan biaya (Rp)" name="fee" type="number" min={0} defaultValue={0} required={false} />
              <Field label="Tanggal transfer" name="paid_on" type="date" defaultValue={hariIni()} />
              <Field label="No. referensi transfer" name="reference" required={false} placeholder="Contoh: TRF20261101-01" />
            </div>
            <Field label="Catatan" name="note" required={false} placeholder="Contoh: pencairan pesanan 1–31 Okt" />
            <p className="text-sm text-muted-foreground">
              Jumlah + potongan tidak boleh melebihi saldo. Potongan dipakai bila biaya QRIS/VA Midtrans dibebankan ke posko.
            </p>
          </ActionForm>
        </div>
      </details>
    </article>
  );
}
