import "server-only";
import { createClient } from "@supabase/supabase-js";

// Klien dengan SECRET KEY: melewati RLS. Pakai HANYA di server, dan
// HANYA setelah memastikan pemanggil berhak (mis. requireMe(["pengurus"])).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
