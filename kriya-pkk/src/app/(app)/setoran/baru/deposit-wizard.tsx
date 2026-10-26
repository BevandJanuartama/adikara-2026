"use client";

import { useState } from "react";
import {
  Banknote,
  Camera,
  Check,
  CircleCheck,
  ChevronDown,
  ImageOff,
  Plus,
  RotateCcw,
  Scale,
  Sparkles,
  Trash2,
  UserPlus,
  Wallet,
  CircleX,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, randomName } from "@/lib/image";
import { depositSubtotal } from "@/lib/calc";
import { parseDecimal, rupiah } from "@/lib/format";
import type { Condition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge, Notice, PageHeader, Panel, btn, inputClass, labelClass } from "@/components/kriya-ui";
import { approveDeposit, cancelDeposit, createDeposit, createResident } from "../actions";

type Resident = { id: string; name: string; balance: number };
type Price = { item_type: string; price_per_kg: number };
type Row = { item_type: string; condition: Condition; is_eligible: boolean; weight: string; ai_suggested: boolean; reason?: string };
type ScanResponse = {
  items: { item_type: string; condition: Condition; is_eligible: boolean; reason: string }[];
  note?: string;
  hash?: string;
  cached?: boolean;
  error?: string;
  manual?: boolean;
};

const STEPS = ["Warga & foto", "Cek & timbang", "Persetujuan"];

// Alur setoran 3 langkah (NFR12): 1) warga + foto  2) cek hasil AI & timbang  3) persetujuan warga
export function DepositWizard({ groupId, residents: initial, prices }: { groupId: string; residents: Resident[]; prices: Price[] }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [residents, setResidents] = useState(initial);
  const [residentId, setResidentId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [deposit, setDeposit] = useState<{ depositId: string; total: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [doneText, setDoneText] = useState("");

  const resident = residents.find((r) => r.id === residentId);
  const priceOf = (t: string) => prices.find((p) => p.item_type === t)?.price_per_kg ?? 0;
  const subtotal = (r: Row) => depositSubtotal(parseDecimal(r.weight), priceOf(r.item_type), r.is_eligible);
  const estimate = rows.reduce((s, r) => s + subtotal(r), 0);
  const blankRow = (): Row => ({ item_type: prices[0]?.item_type ?? "", condition: "bersih", is_eligible: true, weight: "", ai_suggested: false });

  function reset() {
    setStep(1);
    setResidentId("");
    setPhotoPath(null);
    setPreview(null);
    setScan(null);
    setRows([]);
    setDeposit(null);
    setError(null);
    setNotice(null);
  }

  // FR14: warga baru langsung dari form setoran
  async function addResident() {
    setError(null);
    if (!newName.trim()) return setError("Nama warga wajib diisi.");
    const res = await createResident({ name: newName, phone: newPhone });
    if (!res.ok) return setError(res.error);
    setResidents((list) => [...list, res.data].sort((a, b) => a.name.localeCompare(b.name)));
    setResidentId(res.data.id);
    setNewName("");
    setNewPhone("");
  }

  // FR07–FR08: kompres → unggah ke Storage → scan AI
  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setNotice(null);
    try {
      setBusy("Mengompres dan mengunggah foto…");
      const blob = await compressImage(file);
      setPreview(URL.createObjectURL(blob));
      const path = `${groupId}/deposits/${randomName()}.jpg`;
      const { error: upErr } = await createClient().storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw new Error(`Gagal mengunggah foto: ${upErr.message}`);
      setPhotoPath(path);

      setBusy("AI sedang mengenali barang…");
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const json = (await res.json()) as ScanResponse;
      if (!res.ok || !json.items?.length) {
        // FR34: AI gagal / kuota habis → tetap jalan secara manual
        setNotice(json.error ?? "AI tidak menemukan barang. Silakan isi manual.");
        setRows([blankRow()]);
      } else {
        setScan(json);
        setRows(
          json.items.map((it) => ({
            item_type: it.item_type,
            condition: it.condition,
            is_eligible: it.is_eligible,
            weight: "",
            ai_suggested: true,
            reason: it.reason,
          })),
        );
        if (json.note) setNotice(json.note);
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((list) => list.map((r, idx) => (idx === i ? { ...r, ...patch, ai_suggested: false } : r))); // FR09: koreksi manual menang
  }

  // FR10: simpan draft → total resmi dari database
  async function submitDraft() {
    setError(null);
    setBusy("Menghitung taksiran…");
    const res = await createDeposit({
      residentId,
      photoPath,
      photoHash: scan?.hash ?? null,
      aiResult: scan ? { items: scan.items, cached: scan.cached ?? false } : null,
      items: rows.map((r) => ({
        item_type: r.item_type,
        condition: r.condition,
        is_eligible: r.is_eligible,
        weight_kg: parseDecimal(r.weight),
        ai_suggested: r.ai_suggested,
        reason: r.reason,
      })),
    });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    setDeposit(res.data);
    setStep(3);
  }

  // FR11–FR12
  async function decide(action: "saldo" | "tunai" | "batal") {
    if (!deposit) return;
    setError(null);
    setBusy("Menyimpan…");
    const res = action === "batal" ? await cancelDeposit(deposit.depositId) : await approveDeposit(deposit.depositId, action === "tunai");
    setBusy(null);
    if (!res.ok) return setError(res.error);
    setDoneText(
      action === "batal"
        ? "Setoran dibatalkan."
        : action === "tunai"
          ? `Bayar tunai ${rupiah(deposit.total)} ke ${resident?.name}. Stok bertambah.`
          : `Saldo ${resident?.name} bertambah ${rupiah(deposit.total)}. Stok bertambah.`,
    );
    setStep(4);
  }

  const summary = (
    <Panel title="Ringkasan setoran" icon={Scale}>
      <dl className="space-y-3 text-base">
        <div>
          <dt className="text-sm text-muted-foreground">Warga</dt>
          <dd className="font-semibold text-tinta">{resident?.name ?? "Belum dipilih"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Barang</dt>
          <dd className="text-tinta">
            {rows.length === 0 ? (
              "Belum ada"
            ) : (
              <ul className="mt-1 space-y-1">
                {rows.map((r, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{r.item_type} {r.weight ? `${r.weight} kg` : ""}</span>
                    <span className="shrink-0 tabular-nums">{rupiah(subtotal(r))}</span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>
      <div className="jahitan mt-5 rounded-xl bg-mentega p-4">
        <p className="text-sm font-semibold text-mentega-ink">{deposit ? "Total resmi" : "Taksiran sementara"}</p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-tinta">{rupiah(deposit?.total ?? estimate)}</p>
      </div>
    </Panel>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Catat setoran" description="Pilih warga, foto barangnya, timbang, lalu minta persetujuan warga." />

      {step < 4 && (
        <ol className="grid grid-cols-3 gap-2" aria-label="Langkah setoran">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const now = step === n;
            return (
              <li
                key={label}
                aria-current={now ? "step" : undefined}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center",
                  now ? "border-hutan bg-card" : "bg-card/60",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                    done ? "bg-hutan text-white" : now ? "bg-mentega text-tinta" : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : n}
                </span>
                <span className={cn("text-sm font-semibold leading-tight", now || done ? "text-tinta" : "text-muted-foreground")}>{label}</span>
              </li>
            );
          })}
        </ol>
      )}

      {busy && (
        <div role="status" className="flex items-center gap-3 rounded-xl bg-daun-muda px-4 py-3 text-base text-tinta">
          <span className="size-5 animate-spin rounded-full border-2 border-hutan border-t-transparent" aria-hidden />
          {busy}
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="warning">{notice}</Notice>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        <div className="min-w-0 space-y-6">
          {/* LANGKAH 1 */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Panel title="Warga penyetor" description="Pilih nama warga yang membawa barang.">
                <div className="space-y-4">
                  <label className="block space-y-1.5">
                    <span className={labelClass}>Nama warga</span>
                    <select className={inputClass} value={residentId} onChange={(e) => setResidentId(e.target.value)}>
                      <option value="">Pilih warga</option>
                      {residents.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (saldo {rupiah(r.balance)})
                        </option>
                      ))}
                    </select>
                  </label>

                  <details className="group rounded-xl border bg-daun-muda/50">
                    <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-base font-semibold text-tinta">
                      <span className="flex items-center gap-2"><UserPlus className="size-5 text-hutan" /> Tambah warga baru</span>
                      <ChevronDown className="size-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="space-y-3 border-t px-4 py-4">
                      <label className="block space-y-1.5">
                        <span className={labelClass}>Nama lengkap</span>
                        <input className={inputClass} placeholder="Contoh: Bu Siti" value={newName} onChange={(e) => setNewName(e.target.value)} />
                      </label>
                      <label className="block space-y-1.5">
                        <span className={labelClass}>Nomor HP <span className="font-normal text-muted-foreground">(opsional)</span></span>
                        <input className={inputClass} inputMode="tel" placeholder="08xxxxxxxxxx" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                      </label>
                      <button type="button" onClick={addResident} className={cn(btn.secondary, "w-full")}>Simpan warga</button>
                    </div>
                  </details>
                </div>
              </Panel>

              <Panel
                title="Foto barang"
                description="AI mengenali jenis dan kondisi barang dari foto."
                className={cn("transition-opacity", !residentId && "pointer-events-none opacity-50")}
              >
                <div className="space-y-4">
                  <label
                    htmlFor="foto"
                    className="jahitan flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-pucuk/70 text-tinta transition-colors hover:bg-pucuk"
                  >
                    <span className="grid size-14 place-items-center rounded-full bg-card shadow-sm">
                      <Camera className="size-7 text-hutan" />
                    </span>
                    <span className="text-lg font-bold">Ambil foto</span>
                    <span className="text-sm text-tinta/80">{residentId ? "Ketuk untuk membuka kamera" : "Pilih warga dulu"}</span>
                  </label>
                  <input id="foto" type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhoto} disabled={!!busy || !residentId} />
                  <button
                    type="button"
                    className={cn(btn.outline, "w-full")}
                    onClick={() => {
                      setRows([blankRow()]);
                      setStep(2);
                    }}
                  >
                    <ImageOff /> Isi manual tanpa foto
                  </button>
                </div>
              </Panel>
            </div>
          )}

          {/* LANGKAH 2 */}
          {step === 2 && (
            <>
              {preview && (
                <div className="overflow-hidden rounded-2xl border bg-card">
                  <img src={preview} alt="Foto setoran" className="max-h-72 w-full object-cover" />
                </div>
              )}

              <div className="space-y-3">
                {rows.map((r, i) => (
                  <div key={i} className="rounded-2xl border bg-card p-4 sm:p-5">
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 pt-1.5">
                        {r.ai_suggested ? <Badge tone="pucuk" icon={Sparkles}>Saran AI</Badge> : <Badge>Diisi manual</Badge>}
                        {r.reason && <span className="text-sm text-muted-foreground">{r.reason}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
                        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-bata-ink hover:bg-bata-soft"
                      >
                        <Trash2 className="size-4" /> Hapus
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <label className="col-span-2 block space-y-1.5">
                        <span className={labelClass}>Jenis barang</span>
                        <select className={inputClass} value={r.item_type} onChange={(e) => updateRow(i, { item_type: e.target.value })}>
                          {prices.map((p) => (
                            <option key={p.item_type} value={p.item_type}>
                              {p.item_type} ({rupiah(p.price_per_kg)}/kg)
                            </option>
                          ))}
                          {!prices.some((p) => p.item_type === r.item_type) && (
                            <option value={r.item_type}>{r.item_type} (tidak ada di tabel harga)</option>
                          )}
                        </select>
                      </label>
                      <label className="block space-y-1.5">
                        <span className={labelClass}>Kondisi</span>
                        <select className={inputClass} value={r.condition} onChange={(e) => updateRow(i, { condition: e.target.value as Condition })}>
                          <option value="bersih">Bersih</option>
                          <option value="kotor">Kotor</option>
                          <option value="rusak">Rusak</option>
                        </select>
                      </label>
                      <label className="block space-y-1.5">
                        <span className={labelClass}>Berat timbangan</span>
                        <span className="relative block">
                          <input
                            inputMode="decimal"
                            placeholder="0,0"
                            value={r.weight}
                            onChange={(e) => updateRow(i, { weight: e.target.value })}
                            className={cn(inputClass, "pr-12 font-bold")}
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-muted-foreground">kg</span>
                        </span>
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <label className="flex cursor-pointer items-center gap-2.5 text-base font-medium text-tinta">
                        <input type="checkbox" className="size-5 accent-hutan" checked={r.is_eligible} onChange={(e) => updateRow(i, { is_eligible: e.target.checked })} />
                        Layak diterima
                        {!r.is_eligible && <span className="text-sm font-semibold text-bata-ink">(dinilai Rp0)</span>}
                      </label>
                      <p className="text-base text-muted-foreground">
                        Subtotal <span className="ml-1 text-lg font-bold tabular-nums text-tinta">{rupiah(subtotal(r))}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" className={cn(btn.outline, "w-full border-dashed")} onClick={() => setRows([...rows, blankRow()])}>
                <Plus /> Tambah jenis barang
              </button>

              <div className="jahitan flex items-center justify-between gap-4 rounded-2xl bg-mentega p-5 xl:hidden">
                <div>
                  <p className="text-sm font-semibold text-mentega-ink">Taksiran sementara</p>
                  <p className="text-2xl font-extrabold tabular-nums text-tinta">{rupiah(estimate)}</p>
                </div>
                <Wallet className="size-7 text-mentega-ink" aria-hidden />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
                <button type="button" className={btn.outline} onClick={() => setStep(1)}>
                  <RotateCcw /> Kembali
                </button>
                <button type="button" className={btn.primary} disabled={!rows.length || !!busy} onClick={submitDraft}>
                  Lanjut ke persetujuan
                </button>
              </div>
            </>
          )}

          {/* LANGKAH 3 */}
          {step === 3 && deposit && (
            <>
              <Panel title={`Tunjukkan ke ${resident?.name ?? "warga"}`} description="Bacakan rincian dan total sebelum warga memutuskan.">
                <ul className="divide-y">
                  {rows.map((r, i) => (
                    <li key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0">
                      <div>
                        <p className="text-base font-semibold text-tinta">{r.item_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {r.weight} kg, {r.condition}
                          {!r.is_eligible && ", tidak layak"}
                        </p>
                      </div>
                      <span className="text-base font-bold tabular-nums text-tinta">{rupiah(subtotal(r))}</span>
                    </li>
                  ))}
                </ul>
                <div className="jahitan mt-4 flex items-center justify-between gap-4 rounded-xl bg-pucuk p-4">
                  <span className="text-base font-bold text-tinta">Total untuk warga</span>
                  <span className="text-2xl font-extrabold tabular-nums text-tinta sm:text-3xl">{rupiah(deposit.total)}</span>
                </div>
              </Panel>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button type="button" className={cn(btn.primary, "h-14")} disabled={!!busy} onClick={() => decide("saldo")}>
                  <Wallet /> Setuju, masuk saldo
                </button>
                <button type="button" className={cn(btn.secondary, "h-14")} disabled={!!busy} onClick={() => decide("tunai")}>
                  <Banknote /> Setuju, bayar tunai
                </button>
                <button type="button" className={cn(btn.danger, "md:col-span-2")} disabled={!!busy} onClick={() => decide("batal")}>
                  <CircleX /> Warga tidak setuju, batalkan
                </button>
              </div>
            </>
          )}

          {/* SELESAI */}
          {step === 4 && (
            <div className="flex flex-col items-center rounded-2xl border bg-card px-6 py-10 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-pucuk text-hutan">
                <CircleCheck className="size-9" aria-hidden />
              </span>
              <h2 className="mt-4 text-2xl font-extrabold text-tinta">Setoran tersimpan</h2>
              <p className="mt-2 max-w-md text-base text-muted-foreground">{doneText}</p>
              <button type="button" className={cn(btn.primary, "mt-6 w-full max-w-sm")} onClick={reset}>
                Catat setoran berikutnya
              </button>
            </div>
          )}
        </div>

        {step < 4 && <aside className="hidden xl:sticky xl:top-10 xl:block">{summary}</aside>}
      </div>
    </div>
  );
}
