const fs = require('fs');

const path = 'app/api/pengajuan/route.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { uploadToMinio, deleteFromMinio }')) {
  content = content.replace("import { uploadToMinio } from '@/lib/minio';", "import { uploadToMinio, deleteFromMinio } from '@/lib/minio';");
}

const targetStr = `
    const updatePayload = { status_pengajuan };
    if (dpl_id) updatePayload.dpl_id = dpl_id;
    if (alasan_penolakan) updatePayload.alasan_penolakan = alasan_penolakan;
`;

const replaceStr = `
    const updatePayload = { status_pengajuan };
    if (dpl_id) updatePayload.dpl_id = dpl_id;
    if (alasan_penolakan) updatePayload.alasan_penolakan = alasan_penolakan;

    if (status_pengajuan === 'ditolak') {
      try {
        const existingPengajuan = await PengajuanMagang.findById(id);
        if (existingPengajuan && existingPengajuan.file_cv_path) {
          await deleteFromMinio(existingPengajuan.file_cv_path);
          updatePayload.file_cv_path = ""; // Kosongkan path di database agar tidak jadi sampah
        }
      } catch (err) {
        console.error("Error deleting CV on reject:", err);
      }
    }
`;

if (!content.includes("if (status_pengajuan === 'ditolak') {")) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log("Updated!");
} else {
  console.log("Already updated!");
}
