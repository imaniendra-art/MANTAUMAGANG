import mongoose from 'mongoose';

const CpmkSchema = new mongoose.Schema({
  nama_cpmk: { type: String, required: true },
  indikator: [{ type: String }],
  saran_kegiatan: { type: String, default: "" },
});

const MatkulSchema = new mongoose.Schema({
  kode: { type: String, required: true },
  nama: { type: String, required: true },
  sks: { type: Number, required: true },
  dosen_pengampu: { type: String, default: "" },
  cpmk: [CpmkSchema],
});

const PaketMatkulSchema = new mongoose.Schema({
  nama_paket: {
    type: String,
    required: [true, 'Nama paket wajib diisi'],
  },
  jenis_skema: {
    type: String,
    enum: ['instansi', 'wirausaha'],
    required: [true, 'Jenis skema wajib diisi'],
  },
  mata_kuliah: [MatkulSchema],
}, { timestamps: true });

delete mongoose.models.PaketMatkul;
export default mongoose.model('PaketMatkul', PaketMatkulSchema);
