const mongoose = require('mongoose');
const fs = require('fs');
const uri = fs.readFileSync('.env.local', 'utf8').match(/MONGODB_URI=(.*)/)[1].trim().replace(/^"|"$/g, '');

const AppConfigSchema = new mongoose.Schema({
  nama_institusi: { type: String, required: true, default: 'Program Studi Manajemen' },
  nama_pejabat_pengesah: { type: String, required: true, default: 'Dr. Ahmad, M.Si' },
  nidn_pejabat: { type: String, required: true, default: '198001012005011001' },
  jabatan_pejabat: { type: String, required: true, default: 'Ketua Program Studi' },
  logo_url: { type: String, default: null },
  singleton_id: { type: String, default: 'GLOBAL_CONFIG', unique: true }
}, { timestamps: true });

const AppConfig = mongoose.models.AppConfig || mongoose.model('AppConfig', AppConfigSchema);

async function run() {
  await mongoose.connect(uri);
  const updateData = {
    nama_institusi: 'a',
    nama_pejabat_pengesah: 'b',
    nidn_pejabat: 'c',
    jabatan_pejabat: 'd',
    logo_url: null
  };
  try {
    const config = await AppConfig.findOneAndUpdate(
      { singleton_id: 'GLOBAL_CONFIG' },
      updateData,
      { new: true }
    );
    console.log("Success:", config);
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
