const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");
  const AppConfigSchema = new mongoose.Schema({
    nama_institusi: String,
    nama_pejabat_pengesah: String,
    nidn_pejabat: String,
    jabatan_pejabat: String,
    logo_url: String,
    singleton_id: String
  }, { timestamps: true });
  const AppConfig = mongoose.model('AppConfig', AppConfigSchema);
  let c = await AppConfig.findOne({ singleton_id: 'GLOBAL_CONFIG' });
  console.log("Found:", c);
  process.exit(0);
}
run();
