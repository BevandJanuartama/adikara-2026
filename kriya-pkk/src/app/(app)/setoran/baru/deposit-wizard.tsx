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
import {
  approveDeposit,
  cancelDeposit,
  createDeposit,
  createResident,
} from "../actions";
import {
  Camera,
  UserPlus,
  Scale,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Plus,
  ArrowRight,
  RotateCcw,
  Wallet,
  Banknote,
} from "lucide-react";

type Resident = { id: string; name: string; balance: number };
type Price = { item_type: string; price_per_kg: number };
type Row = {
  item_type: string;
  condition: Condition;
  is_eligible: boolean;
  weight: string;
  ai_suggested: boolean;
  reason?: string;
};
type ScanResponse = {
  items: {
    item_type: string;
    condition: Condition;
    is_eligible: boolean;
    reason: string;
  }[];
  note?: string;
  hash?: string;
  cached?: boolean;
  error?: string;
  manual?: boolean;
};

const selectClass =
  "h-12 w-full rounded-xl border border-input bg-background px-3 text-base shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function DepositWizard({
  groupId,
  residents: initial,
  prices,
}: {
  groupId: string;
  residents: Resident[];
  prices: Price[];
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
  const [deposit, setDeposit] = useState<{
    depositId: string;
    total: number;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [doneText, setDoneText] = useState("");

  const resident = residents.find((r) => r.id === residentId);
  const priceOf = (t: string) =>
    prices.find((p) => p.item_type === t)?.price_per_kg ?? 0;
  const subtotal = (r: Row) =>
    depositSubtotal(
      parseDecimal(r.weight),
      priceOf(r.item_type),
      r.is_eligible,
    );
  const estimate = rows.reduce((s, r) => s + subtotal(r), 0);
  const blankRow = (): Row => ({
    item_type: prices[0]?.item_type ?? "",
    condition: "bersih",
    is_eligible: true,
    weight: "",
    ai_suggested: false,
  });

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

  async function addResident() {
    setError(null);
    if (!newName.trim()) return setError("Nama warga wajib diisi.");
    const res = await createResident({ name: newName, phone: newPhone });
    if (!res.ok) return setError(res.error);
    setResidents((list) =>
      [...list, res.data].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setResidentId(res.data.id);
    setNewName("");
    setNewPhone("");
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setNotice(null);
    try {
      setBusy("Mengompres & mengunggah foto…");
      const blob = await compressImage(file);
      setPreview(URL.createObjectURL(blob));
      const path = `${groupId}/deposits/${randomName()}.jpg`;
      const { error: upErr } = await createClient()
        .storage.from("photos")
        .upload(path, blob, { contentType: "image/jpeg" });
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
        setNotice(
          json.error ?? "AI tidak menemukan barang. Silakan isi manual.",
        );
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
    setRows((list) =>
      list.map((r, idx) =>
        idx === i ? { ...r, ...patch, ai_suggested: false } : r,
      ),
    );
  }

  async function submitDraft() {
    setError(null);
    setBusy("Menghitung taksiran…");
    const res = await createDeposit({
      residentId,
      photoPath,
      photoHash: scan?.hash ?? null,
      aiResult: scan
        ? { items: scan.items, cached: scan.cached ?? false }
        : null,
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

  async function decide(action: "saldo" | "tunai" | "batal") {
    if (!deposit) return;
    setError(null);
    setBusy("Menyimpan…");
    const res =
      action === "batal"
        ? await cancelDeposit(deposit.depositId)
        : await approveDeposit(deposit.depositId, action === "tunai");
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

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header & Progress Indicator */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Catat Setoran Sampah
          </h1>
          <p className="text-xs text-muted-foreground">
            Kelola setoran anorganik warga dengan mudah
          </p>
        </div>
        {step < 4 && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span>Langkah {Math.min(step, 3)} dari 3</span>
          </div>
        )}
      </div>

      {/* Alert Notices */}
      {busy && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-blue-900 shadow-xs animate-pulse">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium">{busy}</p>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-xs">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-xs">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium">{notice}</p>
        </div>
      )}

      {/* STEP 1: Pilih Warga & Foto */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="warga" className="text-base font-bold">
                1. Pilih Warga Penyetor
              </Label>
              <p className="text-xs text-muted-foreground">
                Cari atau pilih nama warga yang mendatangkan sampah.
              </p>
            </div>

            <select
              id="warga"
              className={selectClass}
              value={residentId}
              onChange={(e) => setResidentId(e.target.value)}
            >
              <option value="">— Pilih Warga —</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Saldo: {rupiah(r.balance)})
                </option>
              ))}
            </select>

            <details className="group rounded-xl border bg-muted/30 p-3.5 transition-all">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm text-foreground">
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-emerald-600" /> Belum
                  terdaftar? Tambah Warga Baru
                </span>
                <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="mt-3.5 space-y-3 pt-3 border-t">
                <div className="space-y-1">
                  <Label className="text-xs">Nama Lengkap</Label>
                  <Input
                    placeholder="Contoh: Ibu Siti"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nomor HP (Opsional)</Label>
                  <Input
                    placeholder="08xxxxxxxxxx"
                    inputMode="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-11 text-base"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addResident}
                  className="w-full h-11 text-sm font-semibold"
                >
                  Simpan Warga Baru
                </Button>
              </div>
            </details>
          </div>

          <div
            className={`space-y-4 rounded-2xl border bg-card p-5 shadow-xs transition-opacity ${residentId ? "" : "pointer-events-none opacity-40"}`}
          >
            <div className="space-y-1.5">
              <Label className="text-base font-bold">
                2. Ambil Foto Sampah
              </Label>
              <p className="text-xs text-muted-foreground">
                Gunakan kamera untuk mendeteksi otomatis jenis barang dengan AI.
              </p>
            </div>

            <label
              htmlFor="foto"
              className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 transition-colors"
            >
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-700 shadow-xs">
                <Camera className="h-7 w-7" />
              </div>
              <span className="text-base font-bold">
                Ambil Foto dengan Kamera
              </span>
              <span className="text-xs text-muted-foreground">
                Ketuk untuk membuka kamera ponsel
              </span>
            </label>
            <input
              id="foto"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onPhoto}
              disabled={!!busy}
            />

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-muted"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase tracking-wider">
                Atau
              </span>
              <div className="flex-grow border-t border-muted"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full text-base font-medium"
              onClick={() => {
                setRows([blankRow()]);
                setStep(2);
              }}
            >
              Isi Manual Tanpa Foto
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Cek AI & Timbang Berat */}
      {step === 2 && (
        <div className="space-y-5">
          {preview && (
            <div className="overflow-hidden rounded-2xl border shadow-xs">
              <img
                src={preview}
                alt="Foto setoran"
                className="max-h-56 w-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                Periksa Barang & Masukkan Berat
              </h2>
              <p className="text-xs text-muted-foreground">
                Sesuaikan hasil deteksi AI dengan timbangan di posko.
              </p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
              <Scale className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((r, i) => {
              const currentSubtotal = subtotal(r);
              return (
                <div
                  key={i}
                  className="space-y-3 rounded-2xl border bg-card p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      {r.ai_suggested ? (
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-blue-800">
                          ✨ Saran AI
                        </span>
                      ) : (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                          ✏️ Manual / Koreksi
                        </span>
                      )}
                      {r.reason && (
                        <span className="text-muted-foreground font-normal">
                          · {r.reason}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                      onClick={() =>
                        setRows(rows.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Jenis Barang
                    </Label>
                    <select
                      className={selectClass}
                      value={r.item_type}
                      onChange={(e) =>
                        updateRow(i, { item_type: e.target.value })
                      }
                    >
                      {prices.map((p) => (
                        <option key={p.item_type} value={p.item_type}>
                          {p.item_type} — {rupiah(p.price_per_kg)}/kg
                        </option>
                      ))}
                      {!prices.some((p) => p.item_type === r.item_type) && (
                        <option value={r.item_type}>
                          {r.item_type} (Tidak ada di tabel harga)
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Kondisi
                      </Label>
                      <select
                        className={selectClass}
                        value={r.condition}
                        onChange={(e) =>
                          updateRow(i, {
                            condition: e.target.value as Condition,
                          })
                        }
                      >
                        <option value="bersih">Bersih</option>
                        <option value="kotor">Kotor</option>
                        <option value="rusak">Rusak</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Berat Timbangan
                      </Label>
                      <div className="relative">
                        <Input
                          inputMode="decimal"
                          placeholder="0.0"
                          value={r.weight}
                          onChange={(e) =>
                            updateRow(i, { weight: e.target.value })
                          }
                          className="h-12 pr-12 text-base font-bold"
                        />
                        <span className="absolute right-3 top-3.5 text-sm text-muted-foreground font-semibold">
                          kg
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-gray-300 text-primary accent-primary"
                        checked={r.is_eligible}
                        onChange={(e) =>
                          updateRow(i, { is_eligible: e.target.checked })
                        }
                      />
                      <span>Layak Diterima</span>
                    </label>
                    {!r.is_eligible && (
                      <span className="text-xs font-bold text-red-600">
                        Dinilai Rp0 (Tidak Layak)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t pt-2.5 text-sm">
                    <span className="text-muted-foreground">
                      Subtotal Nilai:
                    </span>
                    <span className="font-bold text-emerald-700 text-base">
                      {rupiah(currentSubtotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full border-dashed gap-2 text-base font-semibold"
            onClick={() => setRows([...rows, blankRow()])}
          >
            <Plus className="h-4 w-4" /> Tambah Jenis Barang Lain
          </Button>

          {/* Kartu Total Taksiran */}
          <div className="rounded-2xl border bg-emerald-900 p-5 text-white shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-200">
                Total Taksiran Harga Setoran
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {rupiah(estimate)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md">
              <Wallet className="h-6 w-6 text-emerald-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-13 text-base font-semibold gap-2"
              onClick={() => setStep(1)}
            >
              <RotateCcw className="h-4 w-4" /> Kembali
            </Button>
            <Button
              type="button"
              className="h-13 text-base font-bold gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={!rows.length || !!busy}
              onClick={submitDraft}
            >
              Lanjut ke Persetujuan <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Persetujuan Warga */}
      {step === 3 && deposit && (
        <div className="space-y-5">
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Konfirmasi dengan Warga</h2>
              <p className="text-xs text-muted-foreground">
                Tunjukkan rincian ini kepada penyetor:{" "}
                <span className="font-bold text-foreground">
                  {resident?.name}
                </span>
              </p>
            </div>

            <ul className="divide-y rounded-xl border bg-muted/20">
              {rows.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between p-3.5 text-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {r.item_type}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({r.condition})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.weight} kg {!r.is_eligible && "· (Tidak Layak)"}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-700">
                    {rupiah(subtotal(r))}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-base font-bold">Total Diterima Warga</span>
              <span className="text-2xl font-extrabold text-emerald-700">
                {rupiah(deposit.total)}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
              Pilih Opsi Pembayaran / Keputusan
            </p>

            <Button
              type="button"
              className="h-14 w-full text-base font-bold gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
              disabled={!!busy}
              onClick={() => decide("saldo")}
            >
              <Wallet className="h-5 w-5" /> Setuju — Masukkan ke Saldo Warga
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="h-14 w-full text-base font-bold gap-2 border shadow-xs"
              disabled={!!busy}
              onClick={() => decide("tunai")}
            >
              <Banknote className="h-5 w-5 text-emerald-700" /> Setuju — Bayar
              Tunai Langsung
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              disabled={!!busy}
              onClick={() => decide("batal")}
            >
              <XCircle className="h-4 w-4" /> Warga Tidak Setuju (Batalkan
              Setoran)
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Selesai */}
      {step === 4 && (
        <div className="rounded-2xl border bg-card p-8 text-center space-y-6 shadow-sm">
          <div className="inline-flex rounded-full bg-emerald-100 p-4 text-emerald-600 shadow-xs">
            <CheckCircle2 className="h-12 w-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Setoran Berhasil Dicatat!
            </h2>
            <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">
              {doneText}
            </p>
          </div>

          <Button
            type="button"
            className="h-14 w-full text-base font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md"
            onClick={reset}
          >
            Catat Setoran Berikutnya
          </Button>
        </div>
      )}
    </div>
  );
}
