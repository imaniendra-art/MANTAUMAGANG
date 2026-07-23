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
  penilaian_mentor: {
    kedisiplinan: { type: Number, min: 0, max: 100 },
    tanggung_jawab: { type: Number, min: 0, max: 100 },
    komunikasi_tim: { type: Number, min: 0, max: 100 },
    catatan: { type: String }
  },
  penilaian_dpl: {
    sistematika_laporan: { type: Number, min: 0, max: 100 },
    kualitas_isi: { type: Number, min: 0, max: 100 },
    penguasaan_materi: { type: Number, min: 0, max: 100 },
    catatan: { type: String },
    approved_skills: [{ type: String }]
  },
  transkrip_final: [{
    kode_mk: { type: String },
    nama_mk: { type: String },
    sks: { type: Number },
    nilai_angka: { type: Number },
    nilai_huruf: { type: String }
  }],
  alasan_penolakan: { type: String },
  nomor_surat_pengantar: { type: String },
  is_laporan_unlocked: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

export default mongoose.models.PengajuanMagang || mongoose.model('PengajuanMagang', PengajuanMagangSchema);
