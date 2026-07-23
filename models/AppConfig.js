import mongoose from 'mongoose';

const AppConfigSchema = new mongoose.Schema({
  nama_institusi: {
    type: String,
    required: true,
    default: 'Program Studi Manajemen'
  },
  nama_pejabat_pengesah: {
    type: String,
    required: true,
    default: 'Dr. Ahmad, M.Si'
  },
  nama_ketua_institusi: {
    type: String,
    required: true,
    default: 'Dr. Ibrahim Syah, S.E.,M.M'
  },
  nidn_pejabat: {
    type: String,
    required: true,
    default: '198001012005011001'
  },
  jabatan_pejabat: {
    type: String,
    required: true,
    default: 'Ketua Program Studi'
  },
  logo_url: {
    type: String,
    default: null
  },
  // Ensure we only ever have 1 config document by setting a default identifier
  singleton_id: {
    type: String,
    default: 'GLOBAL_CONFIG',
    unique: true
  }
}, { timestamps: true });

delete mongoose.models.AppConfig;
export default mongoose.model('AppConfig', AppConfigSchema);
