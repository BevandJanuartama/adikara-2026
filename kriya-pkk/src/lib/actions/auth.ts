"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalisasiWa } from "@/lib/marketplace/wa";

export type FormState = { error?: string; message?: string } | undefined;

// Hanya path internal ("/checkout?posko=…"), bukan URL situs lain
function tujuanAman(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "");
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/login") ? s : null;
}
const halamanToko = (p: string) => /^\/(checkout|akun|katalog|keranjang|lacak)(\/|\?|$)/.test(p);

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = tujuanAman(formData.get("next"));
  if (!email || !password) return { error: "Email dan kata sandi wajib diisi" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email atau kata sandi salah" };

  const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (p?.role === "pembeli") redirect(next && halamanToko(next) ? next : "/katalog");
  // Pengurus/perajin/admin: kembali ke halaman posko yang tadi dibuka (bukan halaman belanja)
  redirect(next && !halamanToko(next) ? next : "/beranda");
}

const koordinat = z
  .string()
  .trim()
  .optional()
  .refine((v: string | undefined) => !v || Number.isFinite(Number(v)), "Titik lokasi tidak valid");

const setuju = z
  .string()
  .optional()
  .refine((v: string | undefined) => v === "on", "Setujui Kebijakan Privasi untuk mendaftar");

const registerSchema = z.object({
  group_name: z.string().trim().min(3, "Nama kelompok minimal 3 huruf").max(80),
  group_address: z.string().trim().min(5, "Alamat posko wajib diisi").max(200),
  city: z.string().trim().min(3, "Kota/kabupaten wajib diisi").max(80),
  postal_code: z
    .string()
    .trim()
    .optional()
    .refine((v: string | undefined) => !v || /^\d{5}$/.test(v), "Kode pos harus 5 angka"),
  whatsapp: z
    .string()
    .trim()
    .transform((v: string) => normalisasiWa(v) ?? "")
    .refine((v: string) => v !== "", "Nomor WhatsApp belum benar (contoh 0812xxxxxxx)"),
  latitude: koordinat,
  longitude: koordinat,
  full_name: z.string().trim().min(2, "Nama pengurus minimal 2 huruf").max(80),
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  consent: setuju,
});

// FR01: pendaftaran kelompok + akun pengurus (status kelompok: pending sampai diaktivasi admin)
export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data belum lengkap" };
  const { email, password, consent: _c, ...meta } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // dibaca trigger handle_new_user → buat kelompok (alamat, WA, koordinat) + profil pengurus
    options: { data: { ...meta, consent: true } },
  });
  if (error) {
    return { error: error.message.includes("registered") ? "Email sudah terdaftar" : error.message };
  }
  if (!data.session) {
    return { message: "Pendaftaran berhasil. Cek email Anda untuk konfirmasi, lalu masuk." };
  }
  redirect("/status");
}

const buyerSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 huruf").max(80),
  phone: z
    .string()
    .trim()
    .transform((v: string) => normalisasiWa(v) ?? "")
    .refine((v: string) => v !== "", "Nomor HP/WhatsApp belum benar (contoh 0812xxxxxxx)"),
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  consent: setuju,
});

// Akun pembeli: untuk checkout dan melihat status pesanan
export async function registerBuyer(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = buyerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data belum lengkap" };
  const { email, password, full_name, phone } = parsed.data;
  const next = tujuanAman(formData.get("next"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // dibaca trigger handle_new_user → profil berperan "pembeli" (tanpa kelompok)
    options: { data: { account_type: "pembeli", full_name, phone, consent: true } },
  });
  if (error) {
    return { error: error.message.includes("registered") ? "Email sudah terdaftar. Silakan masuk." : error.message };
  }
  if (!data.session) {
    return { message: "Akun dibuat. Cek email Anda untuk konfirmasi, lalu masuk untuk melanjutkan belanja." };
  }
  redirect(next && halamanToko(next) ? next : "/katalog");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Keluar dari toko (pembeli): kembali ke katalog
export async function logoutToko() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/katalog");
}
