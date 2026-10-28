import Link from "next/link";
import { redirect } from "next/navigation";
import { Courier_Prime } from "next/font/google";
import { getMe } from "@/lib/auth";
import { Logo } from "@/components/brand";

// Huruf utama (Plus Jakarta Sans) dimuat di app/layout.tsx. Courier Prime hanya untuk nota setoran.
const nota = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Palet pastel KriyaPKK + tinta gelap untuk teks (kontras AA)
const THEME = {
  "--tinta": "#24361F",
  "--hutan": "#3E5E35",
  "--daun-muda": "#EEF4E9",
  "--mentega": "#FBE6B1",
  "--pucuk": "#B2D4AB",
  "--sage": "#94B587",
  "--persik": "#F6D5AC",
  "--kertas": "#FFFEFA",
} as React.CSSProperties;

// Tambalan terang memakai jahitan gelap, tambalan gelap memakai jahitan putih
const DARK = new Set(["--tinta", "--hutan"]);

// Pola tambalan perca (8 × 6), urutan tetap supaya tampilan sama setiap kali
const PATCH_ORDER = [
  "--mentega", "--sage", "--daun-muda", "--mentega", "--persik", "--pucuk", "--persik", "--pucuk",
  "--sage", "--mentega", "--hutan", "--pucuk", "--tinta", "--mentega", "--tinta", "--persik",
  "--hutan", "--sage", "--pucuk", "--tinta", "--pucuk", "--daun-muda", "--mentega", "--pucuk",
  "--mentega", "--daun-muda", "--sage", "--pucuk", "--daun-muda", "--hutan", "--daun-muda", "--hutan",
  "--persik", "--mentega", "--hutan", "--mentega", "--pucuk", "--daun-muda", "--persik", "--sage",
  "--sage", "--persik", "--sage", "--persik", "--mentega", "--pucuk", "--sage", "--persik",
];

function Patch({
  color,
  i,
  small = false,
  className = "",
}: {
  color: string;
  i: number;
  small?: boolean;
  className?: string;
}) {
  const striped = i % 5 === 2; // sebagian bermotif garis, seperti kain bermotif
  const dark = DARK.has(color);
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: `var(${color})`,
        backgroundImage: striped
          ? `repeating-linear-gradient(45deg, ${dark ? "rgba(255,255,255,.14)" : "rgba(36,54,31,.07)"} 0 5px, transparent 5px 11px)`
          : undefined,
      }}
    >
      {/* jahitan */}
      <span
        className={`absolute rounded-[3px] border border-dashed ${small ? "inset-1" : "inset-1.5"} ${
          dark ? "border-white/40" : "border-[#24361F]/25"
        }`}
      />
    </div>
  );
}

const btnPrimary =
  "inline-flex h-13 items-center justify-center rounded-full bg-(--hutan) px-7 text-base font-bold text-white transition-colors hover:bg-(--tinta) focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--tinta)";
// Untuk latar hijau tua (ajakan akhir)
const btnLight =
  "inline-flex h-13 items-center justify-center rounded-full bg-(--mentega) px-7 text-base font-bold text-(--tinta) transition-colors hover:bg-[#F6D98D] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white";
const btnSecondary =
  "inline-flex h-13 items-center justify-center rounded-full border-2 border-(--tinta) px-7 text-base font-bold text-(--tinta) transition-colors hover:bg-(--daun-muda) focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--tinta)";

const STEPS = [
  {
    title: "Timbang dan foto",
    text: "Pengurus memotret barang setoran. AI mengenali jenis dan kondisinya, berat diisi dari timbangan, harga diambil dari tabel posko.",
  },
  {
    title: "Stok tercatat",
    text: "Setelah warga setuju, saldo warga dan stok bahan bertambah otomatis, lengkap dengan nilainya.",
  },
  {
    title: "Pilih kerajinan",
    text: "Dapur kreasi menyarankan produk yang stoknya cukup, beserta modal, upah, harga jual, dan panduan yang bisa dibacakan.",
  },
  {
    title: "Jual dan lihat dampak",
    text: "Penjualan masuk buku kas. Dashboard menunjukkan kilogram sampah, rupiah ke warga, dan laba kelompok.",
  },
];

// Contoh: 10 pouch × Rp16.000 = Rp160.000 (template bawaan aplikasi)
const SPLIT = [
  { label: "Upah ibu-ibu perajin", amount: 75000, color: "--mentega" },
  { label: "Masuk kas PKK", amount: 47500, color: "--hutan" },
  { label: "Bahan dari warung", amount: 25000, color: "--pucuk" },
  { label: "Sudah dibayar ke warga", amount: 7500, color: "--persik" },
  { label: "Porsi alat", amount: 5000, color: "--sage" },
];
const TOTAL = SPLIT.reduce((s, x) => s + x.amount, 0);
const rp = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

const AUDIENCE = [
  {
    who: "Pengurus posko",
    text: "Kasir setoran, stok, buku kas, dan laporan laba rugi dalam satu aplikasi di HP. Huruf besar, tombol besar, tiga langkah per tugas.",
    color: "--pucuk",
  },
  {
    who: "Ibu-ibu perajin",
    text: "Tahu apa yang dibuat hari ini, bagaimana cara membuatnya, dan berapa upah yang diterima.",
    color: "--mentega",
  },
  {
    who: "Warga penyetor",
    text: "Nilai setoran dihitung dari tabel harga yang sama untuk semua orang, dan bisa dilihat sebelum warga setuju.",
    color: "--persik",
  },
];

export default async function Home() {
  const me = await getMe();
  if (me) redirect(me.role === "admin" ? "/admin" : "/beranda");

  return (
    <div
      className="min-h-dvh overflow-x-clip bg-(--kertas) font-sans text-(--tinta)"
      style={THEME}
    >
      <style>{`
        @keyframes kp-print { from { opacity: 0; transform: translateY(-3px) } to { opacity: 1; transform: none } }
        @keyframes kp-stamp { 0% { opacity: 0; transform: scale(1.7) } 100% { opacity: 1; transform: scale(1) } }
        @keyframes kp-rise { from { opacity: 0; transform: translateY(28px) } to { opacity: 1; transform: none } }
        .kp-print { animation: kp-print .3s ease-out both }
        .kp-stamp { animation: kp-stamp .35s cubic-bezier(.2,1.5,.4,1) both }
        .kp-rise { animation: kp-rise .6s cubic-bezier(.2,.8,.2,1) both }
        @media (prefers-reduced-motion: reduce) { .kp-print, .kp-stamp, .kp-rise { animation: none } }
      `}</style>

      {/* Navigasi */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/katalog"
            className="rounded-full px-3 py-2 text-base font-semibold hover:bg-(--daun-muda) focus-visible:outline-2 focus-visible:outline-(--tinta) sm:px-4"
          >
            Belanja
          </Link>
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-base font-semibold hover:bg-(--daun-muda) focus-visible:outline-2 focus-visible:outline-(--tinta)"
          >
            Masuk
          </Link>
          <Link
            href="/daftar"
            className="hidden rounded-full bg-(--hutan) px-5 py-2.5 text-base font-semibold text-white hover:bg-(--tinta) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tinta) sm:inline-flex"
          >
            Daftarkan kelompok
          </Link>
        </nav>
      </header>

      {/* Hero: nota setoran yang "tercetak" di atas tambalan perca */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-20 pt-6 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28 lg:pt-12">
        <div>
          <h1 className="text-[2.35rem] leading-[1.04] font-extrabold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[3.4rem] xl:text-[3.9rem]">
            Sampah warga jadi kerajinan. Kas PKK ikut bertambah.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-(--tinta)/80 sm:text-xl">
            KriyaPKK mencatat setoran sampah anorganik di posko, menghitung stok
            bahan, lalu menyarankan kerajinan yang bisa dibuat lengkap dengan
            modal, harga jual, dan panduannya.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/daftar" className={btnPrimary}>
              Daftarkan kelompok PKK
            </Link>
            <Link href="/login" className={btnSecondary}>
              Masuk ke posko
            </Link>
          </div>
          <p className="mt-5 text-base text-(--tinta)/65">
            Sekali aktivasi, tanpa biaya bulanan.{" "}
            <Link href="/katalog" className="font-semibold text-(--hutan) underline underline-offset-4">
              Atau belanja produk PKK di katalog
            </Link>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[34rem] sm:pb-20 lg:pb-0">
          {/* tambalan perca: latar penuh di HP, panel 8×6 di layar lebar */}
          <div
            className="absolute inset-0 grid grid-cols-8 grid-rows-6 overflow-hidden rounded-[26px] shadow-[0_30px_60px_-30px_rgba(36,54,31,.55)] sm:relative sm:inset-auto sm:aspect-[8/6]"
            aria-hidden
          >
            {PATCH_ORDER.map((c, i) => (
              <Patch key={i} color={c} i={i} />
            ))}
          </div>

          <div className="relative flex flex-col gap-16 px-4 pb-8 pt-7 sm:contents">
            {/* nota setoran */}
            <div className="relative w-[90%] -rotate-[2deg] sm:absolute sm:left-[-3%] sm:top-[7%] sm:w-[54%] sm:-rotate-[3deg] lg:left-[-4%] xl:left-[-7%]">
              <div
                className={`${nota.className} relative rounded-sm bg-white px-4 pb-5 pt-4 text-[13px] leading-[1.45] text-[#2B3328] shadow-[0_18px_40px_-14px_rgba(36,54,31,.6)]`}
              >
                <div className="kp-print" style={{ animationDelay: ".15s" }}>
                  <p className="font-bold">Posko PKK Melati RW 04</p>
                  <p>Nota setoran, Bu Siti</p>
                </div>
                <p
                  className="kp-print my-2 overflow-hidden whitespace-nowrap text-[#2B3328]/50"
                  style={{ animationDelay: ".35s" }}
                >
                  - - - - - - - - - - - - - - - - - - - -
                </p>
                {[
                  {
                    a: "Kain perca",
                    b: "2,5 kg",
                    c: "7.500",
                    d: "@ Rp3.000/kg",
                  },
                  { a: "Kardus", b: "1,0 kg", c: "1.500", d: "@ Rp1.500/kg" },
                  {
                    a: "Pecahan kaca",
                    b: "0,4 kg",
                    c: "0",
                    d: "tidak layak, berbahaya",
                  },
                ].map((row, i) => (
                  <div
                    key={row.a}
                    className="kp-print mb-1.5"
                    style={{ animationDelay: `${0.55 + i * 0.22}s` }}
                  >
                    <p className="grid grid-cols-[1fr_auto_3.2rem] gap-x-3">
                      <span>{row.a}</span>
                      <span className="tabular-nums">{row.b}</span>
                      <span className="text-right tabular-nums">{row.c}</span>
                    </p>
                    <p
                      className={`text-[12px] ${i === 2 ? "text-[#A8402F]" : "text-[#2B3328]/60"}`}
                    >
                      {row.d}
                    </p>
                  </div>
                ))}
                <p
                  className="kp-print my-2 overflow-hidden whitespace-nowrap text-[#2B3328]/50"
                  style={{ animationDelay: "1.25s" }}
                >
                  - - - - - - - - - - - - - - - - - - - -
                </p>
                <p
                  className="kp-print flex justify-between font-bold"
                  style={{ animationDelay: "1.4s" }}
                >
                  <span>Masuk saldo</span>
                  <span>Rp9.000</span>
                </p>
                {/* stempel */}
                <div className="absolute -bottom-14 right-3 rotate-[-14deg]">
                  <div
                    className="kp-stamp grid size-[74px] place-items-center rounded-full border-[3px] border-(--hutan) bg-white/80 text-center text-[11px] font-bold leading-tight text-(--hutan)"
                    style={{ animationDelay: "1.7s" }}
                  >
                    Disetujui
                    <br />
                    warga
                  </div>
                </div>
              </div>
            </div>

            {/* kartu ide produk */}
            <div className="relative ml-auto w-[88%] rotate-[2deg] sm:absolute sm:bottom-0 sm:right-[-3%] sm:w-[52%] lg:bottom-[-14%] lg:right-[-3%] xl:right-[-8%]">
              <div
                className="kp-rise rounded-2xl bg-white p-5 shadow-[0_24px_50px_-18px_rgba(36,54,31,.55)] ring-1 ring-(--tinta)/10"
                style={{ animationDelay: "2.05s" }}
              >
                <p className="text-[13px] font-semibold text-(--hutan)">
                  Cukup untuk 10 unit dari stok
                </p>
                <p className="mt-0.5 text-lg font-extrabold leading-snug">
                  Pouch kosmetik kain perca
                </p>
                <dl className="mt-3 space-y-1 text-[14px]">
                  {[
                    ["Bahan dari stok", "Rp750"],
                    ["Bahan dari warung", "Rp2.500"],
                    ["Porsi alat", "Rp500"],
                    ["Upah perajin", "Rp7.500"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between text-(--tinta)/75"
                    >
                      <dt>{k}</dt>
                      <dd className="tabular-nums">{v}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-dashed border-(--tinta)/25 pt-1.5 font-bold">
                    <dt>Modal</dt>
                    <dd className="tabular-nums">Rp11.250</dd>
                  </div>
                  <div className="flex justify-between text-base font-extrabold">
                    <dt>Harga jual</dt>
                    <dd className="tabular-nums">Rp16.000</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cara kerja: urutan nyata, jadi diberi nomor */}
      <section className="bg-(--daun-muda)">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-[2.6rem]">
            Dari posko ke kas kelompok dalam empat langkah
          </h2>
          <ol className="relative mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {/* benang jahitan yang menyambung langkah */}
            <span
              className="absolute left-6 right-[calc((100%_-_6rem)_/_4_-_1.5rem)] top-6 hidden border-t-2 border-dashed border-(--tinta)/30 lg:block"
              aria-hidden
            />
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="relative grid size-12 place-items-center rounded-full bg-(--mentega) text-lg font-extrabold ring-8 ring-(--daun-muda)">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-(--tinta)/80">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-10 max-w-2xl text-base text-(--tinta)/70">
            Kalau AI sedang tidak tersedia atau kuota harian habis, semua
            langkah tetap bisa diisi manual.
          </p>
        </div>
      </section>

      {/* Contoh hitungan */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-end">
          <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-[2.6rem]">
            Ke mana {rp(TOTAL)} dari 10 pouch?
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-(--tinta)/80">
            Contoh dari 2,5 kg kain perca setoran Bu Siti, memakai template
            pouch dan harga bawaan aplikasi. Setiap kelompok bisa mengatur harga
            per kg, upah per jam, dan margin sendiri.
          </p>
        </div>

        <div
          className="mt-10 flex h-16 overflow-hidden rounded-2xl sm:h-20"
          role="img"
          aria-label={SPLIT.map((s) => `${s.label} ${rp(s.amount)}`).join(", ")}
        >
          {SPLIT.map((s, i) => (
            <div
              key={s.label}
              className="flex"
              style={{ flexBasis: `${(s.amount / TOTAL) * 100}%` }}
            >
              <Patch color={s.color} i={i} className="flex-1" />
            </div>
          ))}
        </div>
        <ul className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          {SPLIT.map((s) => (
            <li key={s.label} className="flex gap-3">
              <span
                className="mt-1.5 size-3.5 shrink-0 rounded-[3px] ring-1 ring-[#24361F]/20"
                style={{ background: `var(${s.color})` }}
                aria-hidden
              />
              <span>
                <span className="block text-xl font-extrabold tabular-nums">
                  {rp(s.amount)}
                </span>
                <span className="text-base text-(--tinta)/75">{s.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Untuk siapa */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:pb-24">
        <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-[2.6rem]">
          Satu aplikasi, tiga orang yang terbantu
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
          {AUDIENCE.map((a) => (
            <div
              key={a.who}
              className="relative rounded-3xl p-7"
              style={{ background: `var(${a.color})` }}
            >
              <span
                className="pointer-events-none absolute inset-2 rounded-[18px] border-[1.5px] border-dashed border-[#24361F]/25"
                aria-hidden
              />
              <h3 className="relative text-xl font-bold">{a.who}</h3>
              <p className="relative mt-2 text-base leading-relaxed text-(--tinta)/85">
                {a.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Ajakan akhir */}
      <section className="bg-(--hutan) text-white">
        <div className="grid h-5 grid-cols-[repeat(24,1fr)]" aria-hidden>
          {Array.from(
            { length: 24 },
            (_, i) => PATCH_ORDER[(i * 5) % PATCH_ORDER.length],
          ).map((c, i) => (
            <Patch key={i} color={c} i={i} small />
          ))}
        </div>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            Mulai dari satu posko RW.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            Daftarkan kelompok, sesuaikan tabel harga dengan pengepul setempat,
            lalu terima setoran pertama. Data setiap kelompok terpisah dan hanya
            bisa dibuka anggotanya.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/daftar"
              className={btnLight}
            >
              Daftarkan kelompok PKK
            </Link>
            <Link
              href="/login"
              className="inline-flex h-13 items-center justify-center rounded-full border-2 border-white/70 px-7 text-base font-bold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
            >
              Masuk ke posko
            </Link>
          </div>
          <p className="mt-16 max-w-2xl text-sm leading-relaxed text-white/75">
            KriyaPKK adalah karya Divisi Inovasi Software ADIKARA 2026, Fakultas
            Informatika Telkom University. Mendukung SDG 8, 11, 9, 4, dan 3
            serta Asta Cita 6, 2, dan 4.
          </p>
        </div>
      </section>
    </div>
  );
}
