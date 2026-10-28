import "server-only";

// Kirim WhatsApp lewat Fonnte: POST https://api.fonnte.com/send (header Authorization: token)
// Tidak pernah melempar error: notifikasi gagal tidak boleh menggagalkan pesanan.
export async function kirimWa(target: string | null | undefined, pesan: string): Promise<boolean> {
  const token = process.env.FONNTE_API_TOKEN;
  if (!token || !target) {
    console.warn("[fonnte] dilewati:", !token ? "FONNTE_API_TOKEN kosong" : "nomor WA posko belum diisi");
    return false;
  }
  try {
    const form = new FormData();
    form.set("target", target);
    form.set("message", pesan);
    form.set("countryCode", "62");
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const json = (await res.json().catch(() => null)) as { status?: boolean; reason?: string } | null;
    if (!res.ok || json?.status === false) {
      console.warn("[fonnte] gagal:", json?.reason ?? res.statusText);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[fonnte] error:", e);
    return false;
  }
}
