// NFR03: kecilkan foto di browser (sisi terpanjang 768 px, JPEG 70%) sebelum diunggah.
// Biaya token AI Vision mengikuti ukuran gambar, jadi ini juga menghemat kuota.
export async function compressImage(file: File, maxSize = 768, quality = 0.7): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung kompres foto");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Gagal mengompres foto");
  return blob;
}

// Nama file unik (crypto.randomUUID tidak tersedia di http:// saat uji lewat HP di jaringan lokal)
export const randomName = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
