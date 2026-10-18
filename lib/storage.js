import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Menyimpan data URL base64 ke disk fisik di folder /public/uploads/[folderName]
 * @param {string} dataUrl - String base64 data URL (e.g. data:image/jpeg;base64,...)
 * @param {string} folderName - Subfolder di dalam /public/uploads (default: 'logbook')
 * @returns {Promise<string>} - Public relative URL (e.g. /uploads/logbook/logbook-xxx.jpg)
 */
export async function saveBase64File(dataUrl, folderName = 'logbook') {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  
  // Jika sudah berupa path URL file fisik, jangan diubah
  if (dataUrl.startsWith('/uploads/') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  // Cek apakah format valid data URL
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return dataUrl; // fallback jika bukan base64
  }

  const mimeType = matches[1].toLowerCase();
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Tentukan ekstensi file berdasarkan mime type
  let ext = 'jpg';
  if (mimeType.includes('png')) ext = 'png';
  else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
  else if (mimeType.includes('webp')) ext = 'webp';
  else if (mimeType.includes('pdf')) ext = 'pdf';

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folderName);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uniqueId = crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substring(2, 10);
  const fileName = `${folderName}-${Date.now()}-${uniqueId}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  return `/uploads/${folderName}/${fileName}`;
}

/**
 * Menghapus file lokal yang ada di /public/uploads jika ada
 * @param {string} fileUrl - URL relatif file (e.g. /uploads/logbook/...)
 */
export async function deleteLocalFile(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  if (!fileUrl.startsWith('/uploads/')) return;

  try {
    const relativePath = fileUrl.replace(/^\//, ''); // hapus slash di awal
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  } catch (err) {
    console.error("Gagal menghapus file lokal:", fileUrl, err.message);
  }
}
