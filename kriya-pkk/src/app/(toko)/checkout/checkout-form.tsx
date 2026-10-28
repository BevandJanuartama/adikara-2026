"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  CreditCard,
  LoaderCircle,
  MapPin,
  QrCode,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { btn, EmptyState, MoneyRow, Notice, PageHeader, Panel, inputClass, labelClass } from "@/components/kriya-ui";
import { keranjang, useKeranjang } from "@/lib/marketplace/keranjang";
import { MAKS_JARAK_KM, jarakKm, titikValid, type Titik } from "@/lib/marketplace/geo";
import { normalisasiWa } from "@/lib/marketplace/wa";
import { bayar } from "@/lib/marketplace/snap";
import type { PoskoToko, TarifKurir } from "@/lib/marketplace/types";
import { FotoProduk } from "@/components/toko/foto-produk";
import { LokasiInput } from "@/components/toko/lokasi-input";
import { PetaLokasi } from "@/components/toko/peta-lokasi";

type Metode = "ambil" | "kurir";

export function CheckoutForm({ posko, clientKey }: { posko: PoskoToko; clientKey: string }) {
  const router = useRouter();
  const semua = useKeranjang();
  const items = useMemo(() => semua.filter((i) => i.posko_slug === posko.slug), [semua, posko.slug]);
  const itemsKunci = items.map((i) => `${i.id}:${i.qty}`).join(",");

  const [nama, setNama] = useState("");
  const [hp, setHp] = useState("");
  const [email, setEmail] = useState("");
  const [catatan, setCatatan] = useState("");
  const [metode, setMetode] = useState<Metode>("ambil");
  const [alamat, setAlamat] = useState("");
  const [kota, setKota] = useState("");
  const [kodePos, setKodePos] = useState("");
  const [titik, setTitik] = useState<Titik | null>(null);

  const [tarif, setTarif] = useState<TarifKurir[] | null>(null);
  const [pilihan, setPilihan] = useState<string>("");
  const [cekSibuk, setCekSibuk] = useState(false);
  const [cekGalat, setCekGalat] = useState<string | null>(null);
  const [kirimSibuk, setKirimSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  // Ongkir harus dicek ulang bila tujuan atau isi keranjang berubah
  useEffect(() => {
    setTarif(null);
    setPilihan("");
  }, [titik?.lat, titik?.lng, kodePos, itemsKunci]);

  const asal = { lat: Number(posko.latitude), lng: Number(posko.longitude) };
  const jarak = titik && titikValid(asal) ? jarakKm(asal, titik) : null;
  const terlaluJauh = jarak !== null && jarak > MAKS_JARAK_KM;
  const tarifDipilih = tarif?.find((t) => `${t.company}:${t.type}` === pilihan) ?? null;

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const ongkir = metode === "kurir" ? tarifDipilih?.price ?? 0 : 0;
  const total = subtotal + ongkir;

  const hpValid = !!normalisasiWa(hp);
  const siap =
    items.length > 0 &&
    nama.trim().length >= 2 &&
    hpValid &&
    (metode === "ambil" || (alamat.trim().length >= 10 && !!titik && !terlaluJauh && !!tarifDipilih));

  async function cekOngkir() {
    if (!titik) return;
    setCekSibuk(true);
    setCekGalat(null);
    try {
      const res = await fetch("/api/ongkir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posko: posko.slug,
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          tujuan: { lat: titik.lat, lng: titik.lng, kode_pos: kodePos },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal cek ongkir");
      setTarif(json.tarif as TarifKurir[]);
      const termurah = (json.tarif as TarifKurir[])[0];
      if (termurah) setPilihan(`${termurah.company}:${termurah.type}`);
    } catch (e) {
      setCekGalat(e instanceof Error ? e.message : "Gagal cek ongkir");
    } finally {
      setCekSibuk(false);
    }
  }

  async function buatPesanan() {
    if (!siap) return;
    setKirimSibuk(true);
    setGalat(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posko: posko.slug,
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          pembeli: { nama, hp, email },
          pengiriman:
            metode === "ambil"
              ? { metode }
              : {
                  metode,
                  alamat,
                  kota,
                  kode_pos: kodePos,
                  lat: titik!.lat,
                  lng: titik!.lng,
                  kurir: { company: tarifDipilih!.company, type: tarifDipilih!.type },
                },
          catatan: catatan || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Pesanan gagal dibuat");

      // Pesanan sudah tercatat & stok disisihkan → keluarkan dari keranjang
      keranjang.hapusPosko(posko.slug);
      const ke = () => router.push(json.lacak);
      try {
        if (!clientKey) throw new Error("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY kosong");
        await bayar(json.token, clientKey, { onSuccess: ke, onPending: ke, onError: ke, onClose: ke });
      } catch {
        // snap.js gagal dimuat → buka halaman pembayaran Midtrans langsung
        if (json.redirect_url) window.location.href = json.redirect_url;
        else ke();
      }
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Pesanan gagal dibuat");
      setKirimSibuk(false);
    }
  }

  if (items.length === 0 && !kirimSibuk) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={`Belum ada produk dari ${posko.name} di keranjang`}
        action={<Link href="/keranjang" className={btn.primary}>Kembali ke keranjang</Link>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/keranjang" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-tinta">
        <ArrowLeft className="size-4" /> Keranjang
      </Link>
      <PageHeader title="Checkout" description={`Pesanan dari ${posko.name}`} icon={CreditCard} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          {/* 1. Pembeli */}
          <Panel title="1. Data pembeli" description="Dipakai posko untuk menghubungi Anda.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className={labelClass}>Nama lengkap</span>
                <input value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="name" placeholder="Contoh: Ani Wulandari" className={inputClass} />
              </label>
              <label className="block space-y-1.5">
                <span className={labelClass}>Nomor HP / WhatsApp</span>
                <input
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="08xxxxxxxxxx"
                  aria-invalid={hp.length > 5 && !hpValid}
                  className={inputClass}
                />
                {hp.length > 5 && !hpValid && <span className="text-sm text-bata-ink">Nomor belum benar</span>}
              </label>
              <label className="block space-y-1.5 md:col-span-2">
                <span className={labelClass}>
                  Email <span className="font-normal text-muted-foreground">(opsional, untuk bukti bayar)</span>
                </span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="nama@email.com" className={inputClass} />
              </label>
            </div>
          </Panel>

          {/* 2. Pengiriman */}
          <Panel title="2. Pengiriman">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="radiogroup" aria-label="Cara pengiriman">
                <PilihanMetode
                  aktif={metode === "ambil"}
                  onClick={() => setMetode("ambil")}
                  icon={Store}
                  judul="Ambil di posko"
                  teks="Gratis. Ambil setelah posko menandai pesanan siap."
                />
                <PilihanMetode
                  aktif={metode === "kurir"}
                  onClick={() => posko.bisa_kirim && setMetode("kurir")}
                  icon={Truck}
                  judul="Kirim kurir lokal"
                  teks={posko.bisa_kirim ? `Ongkir dicek otomatis, maksimal ${MAKS_JARAK_KM} km dari posko.` : "Posko ini belum melayani pengiriman."}
                  nonaktif={!posko.bisa_kirim}
                />
              </div>

              {metode === "ambil" ? (
                <div className="space-y-3 rounded-xl bg-daun-muda p-4">
                  <p className="flex items-start gap-2 text-base text-tinta">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-hutan" aria-hidden />
                    <span>
                      <span className="font-semibold">{posko.name}</span>
                      <br />
                      {[posko.address, posko.city].filter(Boolean).join(", ") || "Alamat posko belum diisi"}
                    </span>
                  </p>
                  {titikValid(asal) && <PetaLokasi titik={asal} judul={posko.name} />}
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block space-y-1.5">
                    <span className={labelClass}>Alamat lengkap</span>
                    <textarea
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Nama jalan, nomor rumah, RT/RW, patokan"
                      className={cn(inputClass, "h-auto py-3")}
                    />
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className={labelClass}>Kota / kabupaten</span>
                      <input value={kota} onChange={(e) => setKota(e.target.value)} autoComplete="address-level2" placeholder="Contoh: Kab. Bandung" className={inputClass} />
                    </label>
                    <label className="block space-y-1.5">
                      <span className={labelClass}>Kode pos</span>
                      <input
                        value={kodePos}
                        onChange={(e) => setKodePos(e.target.value.replace(/\D/g, "").slice(0, 5))}
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="40257"
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <LokasiInput
                    label="Titik antar"
                    wajib
                    awal={titik}
                    onChange={setTitik}
                    bantuan="Kurir motor (GoSend, GrabExpress) memakai titik ini. Kurir reguler memakai kode pos."
                  />

                  {jarak !== null && (
                    <Notice tone={terlaluJauh ? "error" : "info"}>
                      Jarak dari posko ±{jarak.toFixed(1)} km.
                      {terlaluJauh && ` Di luar jangkauan kurir lokal (maksimal ${MAKS_JARAK_KM} km). Pilih ambil di posko.`}
                    </Notice>
                  )}

                  {titik && !terlaluJauh && (
                    <div className="space-y-3">
                      <button type="button" onClick={cekOngkir} disabled={cekSibuk} className={cn(btn.secondary, "w-full")}>
                        {cekSibuk ? <LoaderCircle className="animate-spin" /> : <Bike />}
                        {cekSibuk ? "Mengecek ongkir…" : tarif ? "Cek ongkir lagi" : "Cek ongkir"}
                      </button>
                      {cekGalat && <Notice tone="error">{cekGalat}</Notice>}
                      {tarif && (
                        <fieldset className="space-y-2">
                          <legend className={cn(labelClass, "mb-2")}>Pilih kurir</legend>
                          {tarif.map((t) => {
                            const key = `${t.company}:${t.type}`;
                            const on = pilihan === key;
                            return (
                              <label
                                key={key}
                                className={cn(
                                  "flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors",
                                  on ? "border-hutan bg-daun-muda" : "hover:bg-daun-muda/50",
                                )}
                              >
                                <input type="radio" name="kurir" value={key} checked={on} onChange={() => setPilihan(key)} className="size-5 accent-hutan" />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-base font-semibold text-tinta">
                                    {t.name} {t.service}
                                  </span>
                                  {t.eta && <span className="block text-sm text-muted-foreground">Estimasi {t.eta}</span>}
                                </span>
                                <span className="shrink-0 text-base font-bold tabular-nums text-tinta">{rupiah(t.price)}</span>
                              </label>
                            );
                          })}
                        </fieldset>
                      )}
                    </div>
                  )}
                </div>
              )}

              <label className="block space-y-1.5">
                <span className={labelClass}>
                  Catatan untuk posko <span className="font-normal text-muted-foreground">(opsional)</span>
                </span>
                <input value={catatan} onChange={(e) => setCatatan(e.target.value)} maxLength={300} placeholder="Contoh: warna pouch yang biru ya" className={inputClass} />
              </label>
            </div>
          </Panel>

          {/* 3. Pembayaran */}
          <Panel title="3. Pembayaran">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl bg-daun-muda px-3 py-2 text-base font-semibold text-tinta">
                <QrCode className="size-5 text-hutan" aria-hidden /> QRIS
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-daun-muda px-3 py-2 text-base font-semibold text-tinta">
                <CreditCard className="size-5 text-hutan" aria-hidden /> Virtual Account (BCA, BNI, BRI, Mandiri, Permata, CIMB)
              </span>
            </div>
            <p className="mt-3 text-base text-muted-foreground">
              Pembayaran lewat Midtrans. Selesaikan dalam 60 menit, setelah itu stok dikembalikan ke posko.
            </p>
          </Panel>
        </div>

        {/* Ringkasan */}
        <aside className="lg:sticky lg:top-24">
          <Panel title="Ringkasan pesanan" icon={ShoppingCart}>
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3">
                  <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <FotoProduk path={i.photo_path} name={i.name} category={i.category} ikonClass="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-base font-semibold text-tinta">{i.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {i.qty} × {rupiah(i.price)}
                    </span>
                  </span>
                  <span className="shrink-0 text-base font-semibold tabular-nums text-tinta">{rupiah(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 divide-y border-t pt-2">
              <MoneyRow label="Subtotal produk" value={rupiah(subtotal)} />
              <MoneyRow
                label={metode === "kurir" ? `Ongkir${tarifDipilih ? ` (${tarifDipilih.name})` : ""}` : "Ongkir"}
                value={metode === "kurir" ? (tarifDipilih ? rupiah(ongkir) : "Belum dicek") : "Gratis"}
              />
              <MoneyRow label="Total bayar" value={rupiah(total)} strong />
            </div>
            {galat && <Notice tone="error" className="mt-4">{galat}</Notice>}
            <button type="button" onClick={buatPesanan} disabled={!siap || kirimSibuk} className={cn(btn.primary, "mt-4 h-14 w-full text-lg")}>
              {kirimSibuk ? <LoaderCircle className="animate-spin" /> : <CreditCard />}
              {kirimSibuk ? "Menyiapkan pembayaran…" : "Bayar sekarang"}
            </button>
            {!siap && !kirimSibuk && (
              <p className="mt-2 text-sm text-muted-foreground">
                {!nama.trim() || !hpValid
                  ? "Lengkapi nama dan nomor HP."
                  : metode === "kurir" && !tarifDipilih
                    ? "Isi alamat, titik antar, lalu cek ongkir."
                    : "Lengkapi data pengiriman."}
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function PilihanMetode({
  aktif,
  onClick,
  icon: Icon,
  judul,
  teks,
  nonaktif = false,
}: {
  aktif: boolean;
  onClick: () => void;
  icon: typeof Store;
  judul: string;
  teks: string;
  nonaktif?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={aktif}
      disabled={nonaktif}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        aktif ? "border-hutan bg-daun-muda" : "border-border bg-card hover:bg-daun-muda/50",
      )}
    >
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", aktif ? "bg-hutan text-white" : "bg-muted text-hutan")}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold text-tinta">{judul}</span>
        <span className="block text-sm text-muted-foreground">{teks}</span>
      </span>
    </button>
  );
}
