// Ubah pesan error dari fungsi database (mis. "STOK_KURANG: ...") jadi kalimat ramah pengguna
const MESSAGES: Record<string, string> = {
  AKSES_DITOLAK: "Anda tidak punya akses untuk tindakan ini.",
  WARGA_TIDAK_DITEMUKAN: "Warga tidak ditemukan.",
  ITEM_KOSONG: "Tambahkan minimal satu jenis barang.",
  BERAT_TIDAK_VALID: "Berat harus lebih dari 0 kg",
  HARGA_BELUM_DIATUR: "Harga per kg belum diatur untuk",
  SETORAN_SUDAH_DIPROSES: "Setoran ini sudah diproses.",
  SALDO_TIDAK_CUKUP: "Saldo warga tidak cukup.",
  STOK_KURANG: "Stok bahan tidak cukup",
  STOK_PRODUK_KURANG: "Stok produk jadi tidak cukup",
  KUOTA_HABIS: "Kuota AI hari ini habis. Gunakan mode manual.",
  JUMLAH_TIDAK_VALID: "Jumlah tidak valid.",
};

export function friendlyError(message: string | undefined | null): string {
  if (!message) return "Terjadi kesalahan. Coba lagi.";
  const match = message.match(/^([A-Z_]+)(?::\s*(.*))?$/);
  if (!match) {
    if (message.includes("row-level security") || message.includes("permission denied")) {
      return MESSAGES.AKSES_DITOLAK;
    }
    return message;
  }
  const [, code, detail] = match;
  const base = MESSAGES[code];
  if (!base) return detail || code;
  return detail ? `${base}: ${detail}` : base;
}
