"use client";

import { useActionState } from "react";
import { addMember } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMember, undefined);

  return (
    <form
      action={action}
      className="rounded-2xl border bg-card p-5 shadow-2xs space-y-4"
    >
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
          <UserPlus className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold">Tambah Anggota Baru</h2>
          <p className="text-xs text-muted-foreground">
            Buat akun untuk pengurus atau perajin baru
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="full_name"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Nama Lengkap
          </Label>
          <Input
            id="full_name"
            name="full_name"
            required
            placeholder="Contoh: Siti Aminah"
            className="h-11 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Alamat Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Contoh: siti@kriyapkk.id"
            className="h-11 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Kata Sandi Awal
          </Label>
          <Input
            id="password"
            name="password"
            type="text"
            minLength={8}
            required
            placeholder="Minimal 8 karakter"
            className="h-11 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="role"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Peran Pengguna
          </Label>
          <select
            id="role"
            name="role"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            defaultValue="anggota"
          >
            <option value="anggota">Anggota (Perajin)</option>
            <option value="pengurus">Pengurus (Admin)</option>
          </select>
        </div>
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.message && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{state.message}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm gap-2"
      >
        {pending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Membuat Akun…</span>
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            <span>Buat Akun Anggota Baru</span>
          </>
        )}
      </Button>
    </form>
  );
}
