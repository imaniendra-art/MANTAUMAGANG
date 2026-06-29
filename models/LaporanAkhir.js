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
  status: {
    type: String,
    enum: ['draft', 'submitted'],
    default: 'draft',
  }
}, { timestamps: true });

export default mongoose.models.LaporanAkhir || mongoose.model('LaporanAkhir', LaporanAkhirSchema);
