"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Building2,
  MapPin,
  User,
  Mail,
  Lock,
} from "lucide-react";

function Field({
  name,
  label,
  type = "text",
  required = true,
  autoComplete,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={name}
        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
      >
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-11 text-xs shadow-2xs transition-colors focus-visible:ring-emerald-600"
      />
    </div>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (state?.error) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-100">
        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
        <span>{state.error}</span>
      </div>
    );
  }
  if (state?.message) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-100">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>{state.message}</span>
      </div>
    );
  }
  return null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      <Field
        name="email"
        label="Alamat Email"
        type="email"
        autoComplete="email"
        placeholder="nama@email.com"
      />
      <Field
        name="password"
        label="Kata Sandi"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
      />

      <Feedback state={state} />

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm gap-2 transition-all"
      >
        {pending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Memproses Masuk…</span>
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            <span>Masuk ke Posko</span>
          </>
        )}
      </Button>

      <div className="text-center text-xs text-muted-foreground pt-1">
        Belum punya akun kelompok?{" "}
        <Link
          href="/daftar"
          className="font-bold text-emerald-700 hover:underline"
        >
          Daftar di sini
        </Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <form action={action} className="space-y-3.5">
      <Field
        name="group_name"
        label="Nama Kelompok PKK"
        placeholder="Contoh: PKK RW 05 Mawar"
      />
      <Field
        name="group_address"
        label="Alamat Posko / Sekretariat"
        required={false}
        placeholder="Contoh: Jl. Merdeka No. 12"
      />
      <Field
        name="full_name"
        label="Nama Pengurus Utama"
        autoComplete="name"
        placeholder="Contoh: Ibu Siti Aminah"
      />
      <Field
        name="email"
        label="Alamat Email Pengurus"
        type="email"
        autoComplete="email"
        placeholder="pengurus@pkk.id"
      />
      <Field
        name="password"
        label="Kata Sandi (Min. 8 Karakter)"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
      />

      <Feedback state={state} />

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm gap-2 transition-all mt-2"
      >
        {pending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Mendaftarkan Kelompok…</span>
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            <span>Daftar Kelompok PKK</span>
          </>
        )}
      </Button>

      <div className="text-center text-xs text-muted-foreground pt-1">
        Sudah punya akun kelompok?{" "}
        <Link
          href="/login"
          className="font-bold text-emerald-700 hover:underline"
        >
          Masuk di sini
        </Link>
      </div>
    </form>
  );
}
