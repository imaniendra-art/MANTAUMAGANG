import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  nama_lengkap: {
    type: String,
    required: [true, 'Nama lengkap wajib diisi'],
  },
  nim_nidn: {
    type: String,
    required: [true, 'NIM/NIDN wajib diisi'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
  },
  role: {
    type: String,
    enum: ['mahasiswa', 'dpl', 'admin_prodi', 'mentor'],
    required: [true, 'Role wajib diisi'],
  },
  program_studi: {
    type: String,
    required: false,
  },
  konsentrasi: {
    type: String,
    required: false,
  },
  kegiatan: {
    type: String,
    required: false,
  },
  nomor_hp: {
    type: String,
    required: false,
  },
  isFirstLogin: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
