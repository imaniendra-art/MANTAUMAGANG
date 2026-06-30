import mongoose from 'mongoose';

const DetailTempatSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  alamat: { type: String, required: true },
  posisi: { type: String, required: true },
});

const PengajuanMagangSchema = new mongoose.Schema({
  mahasiswa_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paket_matkul_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaketMatkul',
    required: true,
  },
  dpl_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  mentor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  is_dpl_confirmed: {
    type: Boolean,
    default: false,
  },
  mitra_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MitraMagang',
    required: false,
  },
  posisi_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PosisiMagang',
    required: false,
  },
  file_cv_path: {
    type: String,
    required: false,
  },
  jenis_skema: {
    type: String,
    enum: ['instansi', 'wirausaha'],
    required: true,
  },
  detail_tempat: DetailTempatSchema,
  status_pengajuan: {
    type: String,
    enum: ['menunggu', 'disetujui', 'ditolak'],
    default: 'menunggu',
  },
  tanggal_mulai: { type: Date, required: true },
  tanggal_selesai: { type: Date, required: true },
  nilai_rekomendasi_sistem: { type: Number },
  nilai_akhir_mutlak: { type: Number },
  catatan_evaluasi: { type: String },
  alasan_penolakan: { type: String },
  is_laporan_unlocked: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

export default mongoose.models.PengajuanMagang || mongoose.model('PengajuanMagang', PengajuanMagangSchema);
