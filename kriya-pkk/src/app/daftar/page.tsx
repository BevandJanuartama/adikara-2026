import { RegisterForm } from "@/components/auth-forms";
import { Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DaftarPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10 bg-background text-foreground">
      <div className="mx-auto w-full space-y-6">
        {/* Header / Logo Branding */}
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider border border-emerald-100">
              Pendaftaran Mitra
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Daftar Kelompok PKK
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed px-2">
              Akun akan otomatis aktif setelah biaya aktivasi diverifikasi oleh
              administrator sistem.
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
