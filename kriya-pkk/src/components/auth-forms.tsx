"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Field({ name, label, type = "text", required = true, autoComplete }: {
  name: string; label: string; type?: string; required?: boolean; autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-base">{label}</Label>
      <Input id={name} name={name} type={type} required={required} autoComplete={autoComplete} className="h-12 text-base" />
    </div>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (state?.error) return <p className="rounded-lg bg-red-50 p-3 text-base text-red-700">{state.error}</p>;
  if (state?.message) return <p className="rounded-lg bg-green-50 p-3 text-base text-green-800">{state.message}</p>;
  return null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field name="email" label="Email" type="email" autoComplete="email" />
      <Field name="password" label="Kata sandi" type="password" autoComplete="current-password" />
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="h-12 w-full text-lg">
        {pending ? "Memproses…" : "Masuk"}
      </Button>
      <p className="text-center text-base">
        Belum punya akun kelompok? <Link href="/daftar" className="font-semibold underline">Daftar</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field name="group_name" label="Nama kelompok PKK" />
      <Field name="group_address" label="Alamat posko" required={false} />
      <Field name="full_name" label="Nama pengurus" autoComplete="name" />
      <Field name="email" label="Email" type="email" autoComplete="email" />
      <Field name="password" label="Kata sandi (min. 8 karakter)" type="password" autoComplete="new-password" />
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="h-12 w-full text-lg">
        {pending ? "Mendaftarkan…" : "Daftar kelompok"}
      </Button>
      <p className="text-center text-base">
        Sudah punya akun? <Link href="/login" className="font-semibold underline">Masuk</Link>
      </p>
    </form>
  );
}
