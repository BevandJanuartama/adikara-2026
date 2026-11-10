"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Building, Building2, Eye, EyeOff, Hash, KeyRound, LoaderCircle, Lock, LogIn, Mail, MapPin, Phone, Send, User, UserPlus } from "lucide-react";
import { login, register, registerBuyer, requestPasswordReset, setNewPassword, type FormState } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Notice, btn, inputClass, labelClass } from "@/components/kriya-ui";
import { LokasiInput } from "@/components/toko/lokasi-input";

function Field({
  name,
  label,
  icon: Icon,
  type = "text",
  required = true,
  autoComplete,
  placeholder,
  hint,
  minLength,
}: {
  name: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className={labelClass}>
        {label} {!required && <span className="font-normal text-muted-foreground">(opsional)</span>}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id={name}
          name={name}
          type={isPassword && show ? "text" : type}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-describedby={hint ? `${name}-hint` : undefined}
          className={cn(inputClass, "pl-11", isPassword && "pr-12")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-daun-muda hover:text-tinta"
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      {hint && (
        <p id={`${name}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (state?.error) return <Notice tone="error">{state.error}</Notice>;
  if (state?.message) return <Notice tone="success">{state.message}</Notice>;
  return null;
}

// Persetujuan Kebijakan Privasi (wajib saat mendaftar)
function Persetujuan() {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-tinta">
      <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-hutan" />
      <span>
        Saya setuju data saya dipakai sesuai{" "}
        <Link href="/privasi" target="_blank" className="font-semibold text-hutan underline underline-offset-4">
          Kebijakan Privasi
        </Link>{" "}
        KriyaPKK.
      </span>
    </label>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field name="email" label="Email" icon={Mail} type="email" autoComplete="email" placeholder="nama@email.com" />
      <Field
        name="password"
        label="Kata sandi"
        icon={Lock}
        type="password"
        autoComplete="current-password"
        placeholder="Kata sandi akun"
      />
      <p className="-mt-2 text-right">
        <Link href="/lupa-sandi" className="text-sm font-semibold text-hutan underline-offset-4 hover:underline">
          Lupa kata sandi?
        </Link>
      </p>

      <Feedback state={state} />

      <button type="submit" disabled={pending} className={cn(btn.primary, "w-full")}>
        {pending ? <LoaderCircle className="animate-spin" /> : <LogIn />}
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="mb-3 text-base font-bold text-tinta">Data kelompok</legend>
        <Field name="group_name" label="Nama kelompok PKK" icon={Building2} placeholder="Contoh: PKK RW 05 Mawar" />
        <Field name="group_address" label="Alamat posko" icon={MapPin} autoComplete="street-address" placeholder="Jalan, RT/RW, kelurahan, kecamatan" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <Field name="city" label="Kota / kabupaten" icon={Building} autoComplete="address-level2" placeholder="Kab. Bandung" />
          <Field name="postal_code" label="Kode pos" icon={Hash} required={false} placeholder="40257" />
        </div>
        <Field
          name="whatsapp"
          label="WhatsApp posko"
          icon={Phone}
          type="tel"
          autoComplete="tel"
          placeholder="0812xxxxxxxx"
          hint="Notifikasi pesanan online dikirim ke nomor ini."
        />
        <LokasiInput
          label="Titik lokasi posko"
          namaLat="latitude"
          namaLng="longitude"
          bantuan="Untuk peta di katalog dan ongkir kurir (maks. 150 km). Bisa diisi nanti di Pengaturan."
        />
      </fieldset>

      <fieldset className="space-y-4 border-t pt-5">
        <legend className="sr-only">Akun pengurus</legend>
        <p className="text-base font-bold text-tinta">Akun pengurus utama</p>
        <Field name="full_name" label="Nama lengkap" icon={User} autoComplete="name" placeholder="Contoh: Siti Aminah" />
        <Field name="email" label="Email" icon={Mail} type="email" autoComplete="email" placeholder="pengurus@pkk.id" />
        <Field
          name="password"
          label="Kata sandi"
          icon={Lock}
          type="password"
          minLength={8}
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          hint="Gunakan minimal 8 karakter."
        />
      </fieldset>

      <Persetujuan />
      <Feedback state={state} />

      <button type="submit" disabled={pending} className={cn(btn.primary, "w-full")}>
        {pending ? <LoaderCircle className="animate-spin" /> : <UserPlus />}
        {pending ? "Mendaftarkan…" : "Daftarkan kelompok"}
      </button>
    </form>
  );
}

// Akun pembeli: cukup nama, HP, email, kata sandi
export function BuyerRegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(registerBuyer, undefined);

  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field name="full_name" label="Nama lengkap" icon={User} autoComplete="name" placeholder="Contoh: Ani Wulandari" />
      <Field
        name="phone"
        label="Nomor HP / WhatsApp"
        icon={Phone}
        type="tel"
        autoComplete="tel"
        placeholder="0812xxxxxxxx"
        hint="Dipakai posko dan ekspedisi untuk menghubungi Anda soal pesanan."
      />
      <Field name="email" label="Email" icon={Mail} type="email" autoComplete="email" placeholder="nama@email.com" />
      <Field
        name="password"
        label="Kata sandi"
        icon={Lock}
        type="password"
        minLength={8}
        autoComplete="new-password"
        placeholder="Minimal 8 karakter"
      />
      <Persetujuan />
      <Feedback state={state} />

      <button type="submit" disabled={pending} className={cn(btn.primary, "w-full")}>
        {pending ? <LoaderCircle className="animate-spin" /> : <UserPlus />}
        {pending ? "Membuat akun…" : "Buat akun pembeli"}
      </button>
    </form>
  );
}

// Lupa kata sandi: minta tautan lewat email
export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-5">
      <Field name="email" label="Email" icon={Mail} type="email" autoComplete="email" placeholder="nama@email.com" />
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={cn(btn.primary, "w-full")}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
        {pending ? "Mengirim…" : "Kirim tautan"}
      </button>
    </form>
  );
}

// Kata sandi baru (setelah membuka tautan dari email)
export function NewPasswordForm() {
  const [state, action, pending] = useActionState(setNewPassword, undefined);
  return (
    <form action={action} className="space-y-5">
      <Field name="password" label="Kata sandi baru" icon={Lock} type="password" minLength={8} autoComplete="new-password" placeholder="Minimal 8 karakter" />
      <Field name="password_confirm" label="Ulangi kata sandi baru" icon={Lock} type="password" minLength={8} autoComplete="new-password" />
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={cn(btn.primary, "w-full")}>
        {pending ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
        {pending ? "Menyimpan…" : "Simpan & masuk"}
      </button>
    </form>
  );
}

const tautan = "font-bold text-hutan underline-offset-4 hover:underline";

export function AuthSwitch({ to, next }: { to: "login" | "daftar" | "daftar-pembeli"; next?: string }) {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  if (to === "login") {
    return (
      <>
        Sudah punya akun?{" "}
        <Link href={`/login${q}`} className={tautan}>
          Masuk di sini
        </Link>
      </>
    );
  }
  if (to === "daftar-pembeli") {
    return (
      <>
        Belum punya akun?{" "}
        <Link href={`/daftar/pembeli${q}`} className={tautan}>
          Daftar sebagai pembeli
        </Link>
      </>
    );
  }
  return (
    <>
      Belum punya akun?{" "}
      <Link href={`/daftar/pembeli${q}`} className={tautan}>
        Daftar sebagai pembeli
      </Link>{" "}
      atau{" "}
      <Link href="/daftar" className={tautan}>
        daftarkan kelompok PKK
      </Link>
    </>
  );
}
