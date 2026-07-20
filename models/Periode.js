import mongoose from 'mongoose';

const PeriodeSchema = new mongoose.Schema({
  nama_periode: {
    type: String,
    required: true,
    unique: true
  },
  status_pendaftaran: {
    type: String,
    enum: ['Dibuka', 'Ditutup'],
    default: 'Ditutup'
  },
  batas_laporan: {
    type: Date
  },
  is_active: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Hapus model lama jika ada (untuk Next.js hot reload)
if (mongoose.models.Periode) {
  delete mongoose.models.Periode;
}

export default mongoose.model('Periode', PeriodeSchema);
