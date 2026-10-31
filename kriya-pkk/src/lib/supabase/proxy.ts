import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Halaman yang boleh dibuka tanpa login
const PUBLIC_PATHS = ["/", "/login", "/daftar", "/daftar/pembeli", "/privasi"];
// Toko online: katalog & keranjang bebas dibuka. Checkout dan /akun (pesanan saya) wajib login.
const PUBLIC_PREFIXES = ["/katalog", "/keranjang", "/lacak"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // PENTING: jangan menaruh kode apa pun di antara createServerClient dan getClaims(),
  // supaya user tidak ter-logout secara acak.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const path = request.nextUrl.pathname;
  // Route /api/* memeriksa login sendiri (balas 401, bukan redirect)
  const isPublic =
    PUBLIC_PATHS.includes(path) ||
    PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/")) ||
    path.startsWith("/api/");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // setelah masuk, kembali ke halaman yang tadi dibuka (mis. /checkout?posko=…)
    url.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Wajib mengembalikan supabaseResponse apa adanya (membawa cookie sesi terbaru)
  return supabaseResponse;
}
