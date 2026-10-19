/**
 * Kompresi dan Auto-Resize Gambar di Sisi Browser (Client-Side)
 * Menggunakan HTML5 Canvas untuk mengubah resolusi dan kualitas gambar sebelum diupload ke server.
 * Menghasilkan file yang sangat ringan (~150KB - 300KB) dengan ketajaman HD.
 */

export function compressImage(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    // Jika bukan file gambar (misal PDF atau dokumen), jangan dikompres via Canvas
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Hitung rasio aspek baru agar tidak gepeng
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback jika browser tidak mendukung canvas context 2D
          return resolve(event.target.result);
        }

        // Gambar ulang ke canvas dengan dimensi baru
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke JPEG dengan kompresi berkualitas 75%
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        // Fallback jika decode gambar gagal
        resolve(event.target.result);
      };

      img.src = event.target.result;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
