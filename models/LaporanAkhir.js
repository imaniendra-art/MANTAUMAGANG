import mongoose from 'mongoose';

const LaporanAkhirSchema = new mongoose.Schema({
  pengajuan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PengajuanMagang',
    required: true,
  },
  mahasiswa_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bab1_pendahuluan: { type: String, default: '' },
  bab2_profil: { type: String, default: '' },
  bab3_aktivitas: { type: String, default: '' },
  bab4_permasalahan: { type: String, default: '' },
  bab5_kesimpulan: { type: String, default: '' },
  bab6_refleksi: { type: String, default: '' },
  file_pengantar: { type: String, default: '' },
  file_penerimaan: { type: String, default: '' },
  file_keterangan: { type: String, default: '' },
  file_struktur_organisasi: { type: String, default: '' },
  catatan_dpl: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'revisi', 'disetujui'],
    default: 'draft',
  }
}, { timestamps: true });

// Hapus model lama dari cache agar enum baru terbaca di Next.js dev server
if (mongoose.models.LaporanAkhir) {
  delete mongoose.models.LaporanAkhir;
}

export default mongoose.model('LaporanAkhir', LaporanAkhirSchema);
