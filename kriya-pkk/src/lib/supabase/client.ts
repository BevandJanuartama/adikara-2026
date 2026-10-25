import { createBrowserClient } from "@supabase/ssr";

// Klien Supabase untuk komponen "use client" (browser)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
