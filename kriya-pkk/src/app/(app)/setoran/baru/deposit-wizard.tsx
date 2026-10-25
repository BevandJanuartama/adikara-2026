"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, randomName } from "@/lib/image";
import { depositSubtotal } from "@/lib/calc";
import { parseDecimal, rupiah } from "@/lib/format";
import type { Condition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { approveDeposit, cancelDeposit, createDeposit, createResident } from "../actions";

type Resident = { id: string; name: string; balance: number };
type Price = { item_type: string; price_per_kg: number };
type Row = { item_type: string; condition: Condition; is_eligible: boolean; weight: string; ai_suggested: boolean; reason?: string };
type ScanResponse = {
  items: { item_type: string; condition: Condition; is_eligible: boolean; reason: string }[];
  note?: string; hash?: string; cached?: boolean; error?: string; manual?: boolean;
};

const selectClass = "h-12 w-full rounded-md border bg-background px-3 text-base";

// Alur setoran 3 langkah (NFR12): 1) warga + foto  2) cek hasil AI & timbang  3) persetujuan warga
export function DepositWizard({ groupId, residents: initial, prices }: {
  groupId: string; residents: Resident[]; prices: Price[];
}) {
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
    setStep(1); setResidentId(""); setPhotoPath(null); setPreview(null); setScan(null);
    setRows([]); setDeposit(null); setError(null); setNotice(null);
  }

  // FR14: warga baru langsung dari form setoran
  async function addResident() {
    setError(null);
    const res = await createResident({ name: newName, phone: newPhone });
    if (!res.ok) return setError(res.error);
    setResidents((list) => [...list, res.data].sort((a, b) => a.name.localeCompare(b.name)));
    setResidentId(res.data.id);
    setNewName(""); setNewPhone("");
  }

  // FR07–FR08: kompres → unggah ke Storage → scan AI
  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setNotice(null);
    try {
      setBusy("Mengompres & mengunggah foto…");
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
        setRows(json.items.map((it) => ({
          item_type: it.item_type, condition: it.condition, is_eligible: it.is_eligible,
          weight: "", ai_suggested: true, reason: it.reason,
        })));
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
        item_type: r.item_type, condition: r.condition, is_eligible: r.is_eligible,
        weight_kg: parseDecimal(r.weight), ai_suggested: r.ai_suggested, reason: r.reason,
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
    const res = action === "batal"
      ? await cancelDeposit(deposit.depositId)
      : await approveDeposit(deposit.depositId, action === "tunai");
    setBusy(null);
    if (!res.ok) return setError(res.error);
    setDoneText(
      action === "batal" ? "Setoran dibatalkan."
        : action === "tunai" ? `Bayar tunai ${rupiah(deposit.total)} ke ${resident?.name}. Stok bertambah.`
        : `Saldo ${resident?.name} bertambah ${rupiah(deposit.total)}. Stok bertambah.`,
    );
    setStep(4);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Setoran baru</h1>
        {step < 4 && <span className="text-base text-muted-foreground">Langkah {Math.min(step, 3)}/3</span>}
      </div>

      {busy && <p className="rounded-lg bg-blue-50 p-3 text-base text-blue-800">{busy}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-base text-red-700">{error}</p>}
      {notice && <p className="rounded-lg bg-amber-50 p-3 text-base text-amber-800">{notice}</p>}

      {step === 1 && (
        <>
          <section className="space-y-3">
            <Label htmlFor="warga" className="text-lg">Warga penyetor</Label>
            <select id="warga" className={selectClass} value={residentId} onChange={(e) => setResidentId(e.target.value)}>
              <option value="">— pilih warga —</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>{r.name} (saldo {rupiah(r.balance)})</option>
              ))}
            </select>
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-base font-semibold">+ Warga baru</summary>
              <div className="mt-3 space-y-2">
                <Input placeholder="Nama" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12 text-base" />
                <Input placeholder="No. HP (opsional)" inputMode="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="h-12 text-base" />
                <Button type="button" variant="secondary" onClick={addResident} className="h-11 w-full text-base">Simpan warga</Button>
              </div>
            </details>
          </section>

          <section className={`space-y-3 ${residentId ? "" : "pointer-events-none opacity-40"}`}>
            <Label htmlFor="foto" className="text-lg">Foto barang setoran</Label>
            <label htmlFor="foto" className="flex h-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed text-lg font-semibold">
              📷 Ambil foto
            </label>
            <input id="foto" type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} disabled={!!busy} />
            <Button type="button" variant="outline" className="h-12 w-full text-base"
              onClick={() => { setRows([blankRow()]); setStep(2); }}>
              Isi manual tanpa foto
            </Button>
          </section>
        </>
      )}

      {step === 2 && (
        <section className="space-y-4">
          {preview && <img src={preview} alt="Foto setoran" className="max-h-56 w-full rounded-xl object-cover" />}
          <p className="text-lg font-semibold">Cek jenis & isi berat dari timbangan</p>
          {rows.map((r, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{r.ai_suggested ? "Saran AI" : "Manual"}{r.reason ? ` · ${r.reason}` : ""}</span>
                <button type="button" className="text-base text-red-700" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>Hapus</button>
              </div>
              <select className={selectClass} value={r.item_type} onChange={(e) => updateRow(i, { item_type: e.target.value })}>
                {prices.map((p) => <option key={p.item_type} value={p.item_type}>{p.item_type} — {rupiah(p.price_per_kg)}/kg</option>)}
                {!prices.some((p) => p.item_type === r.item_type) && <option value={r.item_type}>{r.item_type} (tidak ada di tabel harga)</option>}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select className={selectClass} value={r.condition} onChange={(e) => updateRow(i, { condition: e.target.value as Condition })}>
                  <option value="bersih">Bersih</option>
                  <option value="kotor">Kotor</option>
                  <option value="rusak">Rusak</option>
                </select>
                <Input inputMode="decimal" placeholder="Berat (kg)" value={r.weight}
                  onChange={(e) => updateRow(i, { weight: e.target.value })} className="h-12 text-base" />
              </div>
              <label className="flex items-center gap-2 text-base">
                <input type="checkbox" className="size-5" checked={r.is_eligible} onChange={(e) => updateRow(i, { is_eligible: e.target.checked })} />
                Layak diterima {!r.is_eligible && <span className="text-red-700">(dinilai Rp0)</span>}
              </label>
              <p className="text-right text-base">Subtotal: <b>{rupiah(subtotal(r))}</b></p>
            </div>
          ))}
          <Button type="button" variant="outline" className="h-11 w-full text-base" onClick={() => setRows([...rows, blankRow()])}>
            + Tambah jenis barang
          </Button>
          <p className="text-xl">Taksiran: <b>{rupiah(estimate)}</b></p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-12 text-base" onClick={() => setStep(1)}>Kembali</Button>
            <Button type="button" className="h-12 text-base" disabled={!rows.length || !!busy} onClick={submitDraft}>Lanjut</Button>
          </div>
        </section>
      )}

      {step === 3 && deposit && (
        <section className="space-y-4">
          <p className="text-lg font-semibold">Tunjukkan rincian ke warga: {resident?.name}</p>
          <ul className="divide-y rounded-xl border">
            {rows.map((r, i) => (
              <li key={i} className="flex justify-between p-3 text-base">
                <span>{r.item_type} · {r.weight} kg{!r.is_eligible && " · tidak layak"}</span>
                <span>{rupiah(subtotal(r))}</span>
              </li>
            ))}
          </ul>
          <p className="text-2xl">Total: <b>{rupiah(deposit.total)}</b></p>
          <Button type="button" className="h-14 w-full text-lg" disabled={!!busy} onClick={() => decide("saldo")}>Setuju — masuk saldo</Button>
          <Button type="button" variant="secondary" className="h-14 w-full text-lg" disabled={!!busy} onClick={() => decide("tunai")}>Setuju — bayar tunai</Button>
          <Button type="button" variant="outline" className="h-12 w-full text-base text-red-700" disabled={!!busy} onClick={() => decide("batal")}>Warga tidak setuju (batal)</Button>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4 text-center">
          <p className="text-5xl">✅</p>
          <p className="text-xl font-semibold">{doneText}</p>
          <Button type="button" className="h-14 w-full text-lg" onClick={reset}>Setoran berikutnya</Button>
        </section>
      )}
    </div>
  );
}
