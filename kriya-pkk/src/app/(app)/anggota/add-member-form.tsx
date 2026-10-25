"use client";

import { useActionState } from "react";
import { addMember } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMember, undefined);
  return (
    <form action={action} className="space-y-3 rounded-xl border p-4">
      <h2 className="text-lg font-semibold">Tambah anggota</h2>
      <div className="space-y-1"><Label htmlFor="full_name">Nama</Label><Input id="full_name" name="full_name" required className="h-12 text-base" /></div>
      <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="h-12 text-base" /></div>
      <div className="space-y-1"><Label htmlFor="password">Kata sandi awal</Label><Input id="password" name="password" type="text" minLength={8} required className="h-12 text-base" /></div>
      <div className="space-y-1">
        <Label htmlFor="role">Peran</Label>
        <select id="role" name="role" className="h-12 w-full rounded-md border bg-background px-3 text-base" defaultValue="anggota">
          <option value="anggota">Anggota (pengrajin)</option>
          <option value="pengurus">Pengurus</option>
        </select>
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{state.error}</p>}
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-green-800">{state.message}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full text-base">{pending ? "Menyimpan…" : "Buat akun"}</Button>
    </form>
  );
}
