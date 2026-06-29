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
  indikator_id: {
    type: String,
    required: true,
  },
  bukti_kegiatan: {
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

export default mongoose.models.Logbook || mongoose.model('Logbook', LogbookSchema);
