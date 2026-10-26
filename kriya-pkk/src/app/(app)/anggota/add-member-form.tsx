"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Notice, Panel, btn, inputClass, labelClass } from "@/components/kriya-ui";
import { addMember } from "./actions";

export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMember, undefined);

  return (
    <Panel title="Tambah anggota" description="Buat akun untuk perajin atau pengurus baru." icon={UserPlus}>
      <form action={action} className="space-y-4">
        <label className="block space-y-1.5">
          <span className={labelClass}>Nama lengkap</span>
          <input id="full_name" name="full_name" required placeholder="Contoh: Siti Aminah" className={inputClass} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>Email</span>
          <input id="email" name="email" type="email" required placeholder="siti@contoh.id" className={inputClass} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>Kata sandi awal</span>
          <input id="password" name="password" type="text" minLength={8} required placeholder="Minimal 8 karakter" className={inputClass} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>Peran</span>
          <select id="role" name="role" defaultValue="anggota" className={inputClass}>
            <option value="anggota">Anggota (perajin)</option>
            <option value="pengurus">Pengurus</option>
          </select>
        </label>

        {state?.error && <Notice tone="error">{state.error}</Notice>}
        {state?.message && <Notice tone="success">{state.message}</Notice>}

        <button type="submit" disabled={pending} className={cn(btn.primary, "w-full")}>
          <UserPlus /> {pending ? "Membuat akun…" : "Buat akun"}
        </button>
      </form>
    </Panel>
  );
}
