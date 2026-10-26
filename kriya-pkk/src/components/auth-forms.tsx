"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Building2, Eye, EyeOff, LoaderCircle, Lock, LogIn, Mail, MapPin, User, UserPlus } from "lucide-react";
import { login, register, type FormState } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Notice, btn, inputClass, labelClass } from "@/components/kriya-ui";

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

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-5">
      <Field name="email" label="Email" icon={Mail} type="email" autoComplete="email" placeholder="nama@email.com" />
      <Field
        name="password"
        label="Kata sandi"
        icon={Lock}
        type="password"
        autoComplete="current-password"
        placeholder="Kata sandi akun"
      />

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
        <Field
          name="group_address"
          label="Alamat posko"
          icon={MapPin}
          required={false}
          placeholder="Contoh: Jl. Merdeka No. 12"
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

      <Feedback state={state} />

      <button type="submit" disabled={pending} className={cn(btn.primary, "w-full")}>
        {pending ? <LoaderCircle className="animate-spin" /> : <UserPlus />}
        {pending ? "Mendaftarkan…" : "Daftarkan kelompok"}
      </button>
    </form>
  );
}

export function AuthSwitch({ to }: { to: "login" | "daftar" }) {
  return to === "daftar" ? (
    <>
      Belum punya akun kelompok?{" "}
      <Link href="/daftar" className="font-bold text-hutan underline-offset-4 hover:underline">
        Daftar di sini
      </Link>
    </>
  ) : (
    <>
      Sudah punya akun?{" "}
      <Link href="/login" className="font-bold text-hutan underline-offset-4 hover:underline">
        Masuk di sini
      </Link>
    </>
  );
}
