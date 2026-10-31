import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/kriya-ui";

export const metadata: Metadata = {
  title: "Kebijakan privasi · KriyaPKK",
  description: "Cara KriyaPKK dan posko PKK mengumpulkan, memakai, dan melindungi data pribadi.",
};

const BERLAKU = "1 November 2026";

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-tinta">{judul}</h2>
      <div className="space-y-3 text-base leading-relaxed text-tinta/90 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
    </section>
  );
}

// Kebijakan privasi (mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi)
export default function PrivasiPage() {
  const email = process.env.ADMIN_EMAIL?.trim() || null;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Kebijakan privasi" description={`Berlaku sejak ${BERLAKU}.`} icon={ShieldCheck} />

      <p className="text-base leading-relaxed text-tinta/90">
        KriyaPKK membantu posko PKK mengelola bank sampah, produksi kerajinan daur ulang, dan toko online. Halaman ini menjelaskan data
        pribadi yang kami kumpulkan, untuk apa, siapa yang bisa melihatnya, dan hak Anda sesuai Undang-Undang Nomor 27 Tahun 2022 tentang
        Pelindungan Data Pribadi.
      </p>

      <Bagian judul="1. Data yang kami kumpulkan">
        <p><b>Akun pembeli:</b> nama, nomor HP/WhatsApp, email, dan kata sandi (disimpan terenkripsi oleh Supabase Auth).</p>
        <p>
          <b>Pesanan:</b> nama dan HP penerima, alamat, kota, kode pos, dan titik lokasi pengiriman (bila memakai ekspedisi), isi pesanan,
          catatan untuk posko, status pembayaran, dan nomor resi.
        </p>
        <p>
          <b>Akun posko:</b> nama dan email pengurus/perajin, data kelompok, alamat dan WhatsApp posko, serta rekening posko untuk pencairan
          dana.
        </p>
        <p>
          Kami <b>tidak</b> menyimpan nomor kartu, PIN, atau rekening pembeli. Pembayaran diproses langsung oleh Midtrans. Isi keranjang
          disimpan di browser Anda sendiri.
        </p>
      </Bagian>

      <Bagian judul="2. Untuk apa data dipakai">
        <ul>
          <li>membuat pesanan, menghitung ongkir, memproses pembayaran, dan mengirim paket lewat ekspedisi;</li>
          <li>menampilkan status pesanan dan nomor resi di menu Pesanan saya;</li>
          <li>memberi tahu pengurus posko lewat WhatsApp saat pesanan lunas;</li>
          <li>pembukuan penjualan posko dan pencairan dana pembayaran online ke posko.</li>
        </ul>
        <p>
          Dasarnya adalah persetujuan Anda saat mendaftar dan pelaksanaan pesanan yang Anda buat. Kami tidak menjual data pribadi dan tidak
          memakainya untuk iklan.
        </p>
      </Bagian>

      <Bagian judul="3. Siapa yang bisa melihat atau menerima data">
        <ul>
          <li><b>Pengurus posko penjual:</b> data pesanan di posko itu saja. Anggota perajin tidak melihat data pembeli.</li>
          <li><b>Pengelola KriyaPKK (admin):</b> untuk bantuan dan pencairan dana.</li>
          <li><b>Midtrans:</b> nama, HP, email, dan nominal untuk memproses pembayaran.</li>
          <li><b>Ekspedisi</b> yang dipilih (JNE, J&amp;T, SiCepat, Pos, dll.): nama, HP, dan alamat penerima.</li>
          <li><b>Fonnte:</b> isi WhatsApp pemberitahuan ke pengurus posko, termasuk nama, HP, dan alamat pembeli.</li>
          <li>
            Penyedia infrastruktur: <b>Supabase</b> (database & login), <b>Vercel</b> (hosting), <b>OpenStreetMap</b> (peta). Server mereka
            dapat berada di luar Indonesia.
          </li>
        </ul>
      </Bagian>

      <Bagian judul="4. Penyimpanan & keamanan">
        <ul>
          <li>Data disimpan selama akun aktif. Catatan transaksi disimpan untuk pembukuan posko.</li>
          <li>Semua halaman memakai HTTPS. Akses database dibatasi per akun: pembeli hanya melihat pesanannya sendiri, posko hanya pesanan di poskonya.</li>
          <li>Jaga kerahasiaan kata sandi Anda dan keluar dari akun bila memakai perangkat bersama.</li>
        </ul>
      </Bagian>

      <Bagian judul="5. Hak Anda">
        <ul>
          <li><b>Melihat data:</b> buka menu Pesanan saya.</li>
          <li><b>Memperbaiki data:</b> hubungi posko tempat Anda berbelanja atau pengelola KriyaPKK.</li>
          <li><b>Menghapus akun dan data:</b> ajukan ke pengelola KriyaPKK. Pesanan yang sedang berjalan diselesaikan dulu.</li>
          <li><b>Menarik persetujuan atau mengajukan keberatan:</b> hubungi pengelola KriyaPKK.</li>
        </ul>
      </Bagian>

      <Bagian judul="6. Kontak">
        {email ? (
          <p>
            Pengelola KriyaPKK:{" "}
            <a href={`mailto:${email}`} className="font-semibold text-hutan underline underline-offset-4">
              {email}
            </a>
          </p>
        ) : (
          <p>Hubungi posko tempat Anda berbelanja. Tombol WhatsApp posko ada di halaman detail pesanan.</p>
        )}
        <p>
          Bila kebijakan ini berubah, tanggal berlaku di atas ikut diperbarui.{" "}
          <Link href="/katalog" className="font-semibold text-hutan underline underline-offset-4">Kembali ke katalog</Link>
        </p>
      </Bagian>
    </article>
  );
}
