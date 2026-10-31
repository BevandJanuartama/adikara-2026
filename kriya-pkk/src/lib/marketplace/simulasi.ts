import "server-only";
import { midtransProduksi } from "@/lib/marketplace/midtrans-mode";

// Simulasi pembayaran untuk masa uji Midtrans sandbox.
// Aktif HANYA bila SIMULASI_PEMBAYARAN=true DAN Midtrans tidak di mode produksi.
// Matikan (hapus env-nya) sebelum aplikasi dipakai untuk transaksi sungguhan.
export const simulasiAktif = () => process.env.SIMULASI_PEMBAYARAN === "true" && !midtransProduksi();
