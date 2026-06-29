import mongoose from 'mongoose';

const LogbookSchema = new mongoose.Schema({
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
  tanggal: {
    type: Date,
    required: true,
  },
  deskripsi_kegiatan: {
    type: String,
    required: true,
  },
  matched_indicators: [{
    cpmk_id: String,
    nama_cpmk: String,
    indikator: String
  }],
  bukti_kegiatan: { // untuk foto
    type: String,
  },
  bukti_link: { // untuk link (gdrive, figma, dll)
    type: String,
  },
  nilai_otomatis: {
    type: Number,
    default: 0,
  },
  status_validasi: {
    type: String,
    enum: ['menunggu_mentor', 'divalidasi_mentor', 'divalidasi_dpl', 'revisi'],
    default: 'menunggu_mentor',
  },
}, { timestamps: true });

delete mongoose.models.Logbook;
export default mongoose.models.Logbook || mongoose.model('Logbook', LogbookSchema);
