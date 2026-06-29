import mongoose from 'mongoose';

const PosisiMagangSchema = new mongoose.Schema({
  mitra_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MitraMagang', required: true },
  nama_posisi: { type: String, required: true },
  konsentrasi: { type: String, enum: ['SDM', 'Keuangan', 'Pemasaran', 'Pengembangan Bisnis'], required: true },
  kuota: { type: Number, required: true, default: 1 },
  deskripsi_pekerjaan: { type: String, required: false },
  kriteria_kandidat: { type: String, required: false },
  sistem_kerja: { type: String, enum: ['WFO', 'WFH', 'Hybrid'], default: 'WFO' }
}, { timestamps: true });

export default mongoose.models.PosisiMagang || mongoose.model('PosisiMagang', PosisiMagangSchema);
