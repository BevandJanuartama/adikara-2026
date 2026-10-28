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
  // marketplace
  POSKO_TIDAK_DITEMUKAN: "Posko tidak ditemukan atau toko sedang tutup.",
  POSKO_BELUM_BISA_KIRIM: "Posko ini belum mengisi titik lokasi, jadi hanya bisa ambil di posko.",
  HP_TIDAK_VALID: "Nomor HP/WhatsApp belum benar.",
  NAMA_PEMBELI_WAJIB: "Nama pembeli wajib diisi.",
  KERANJANG_KOSONG: "Keranjang masih kosong.",
  ALAMAT_WAJIB: "Alamat pengiriman wajib diisi.",
  LOKASI_WAJIB: "Tentukan titik lokasi pengiriman dulu.",
  DI_LUAR_JANGKAUAN: "Alamat di luar jangkauan kurir lokal",
  ONGKIR_TIDAK_VALID: "Ongkir belum dihitung. Cek ongkir dulu.",
  METODE_KIRIM_TIDAK_VALID: "Pilih cara pengiriman.",
  PRODUK_TIDAK_DITEMUKAN: "Produk tidak ditemukan atau sudah tidak dijual.",
  NAMA_PRODUK_WAJIB: "Nama produk wajib diisi.",
  ANGKA_TIDAK_VALID: "Harga dan stok tidak boleh negatif.",
  FOTO_TIDAK_VALID: "Foto tidak valid. Unggah ulang fotonya.",
  PESANAN_TIDAK_DITEMUKAN: "Pesanan tidak ditemukan.",
  STATUS_TIDAK_BISA_DIUBAH: "Status pesanan tidak bisa diubah ke tahap itu",
  PESANAN_AMBIL_DI_POSKO: "Pesanan ini diambil di posko, bukan dikirim kurir.",
  PESANAN_DIKIRIM_KURIR: "Pesanan ini dikirim kurir, bukan diambil di posko.",
  NOMINAL_TIDAK_SESUAI: "Nominal pembayaran tidak sesuai tagihan",
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
