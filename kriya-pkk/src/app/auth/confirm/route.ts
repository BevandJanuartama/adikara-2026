import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Tautan dari email Supabase (atur ulang kata sandi, konfirmasi daftar).
// Mendukung dua bentuk tautan:
//   ?token_hash=…&type=recovery&next=/atur-sandi   (template email diubah; bisa dibuka di perangkat mana pun)
//   ?code=…&next=/atur-sandi                        (template bawaan; harus dibuka di browser yang sama)
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const tokenHash = q.get("token_hash");
  const type = q.get("type") as EmailOtpType | null;
  const code = q.get("code");
  const mentah = q.get("next") ?? "/";
  const next = mentah.startsWith("/") && !mentah.startsWith("//") ? mentah : "/";

  const supabase = await createClient();
  let berhasil = false;
  if (tokenHash && type) {
    berhasil = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  } else if (code) {
    berhasil = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  if (berhasil) redirect(next);
  redirect(next === "/atur-sandi" ? "/lupa-sandi?galat=tautan" : "/login");
}
