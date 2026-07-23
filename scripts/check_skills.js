const { default: mongoose } = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const student = await db.collection('users').findOne({ nama_lengkap: /Dwi Astrianti/i });
  const pengajuan = await db.collection('pengajuanmagangs').findOne({ mahasiswa_id: student._id, status_pengajuan: 'disetujui' });

  console.log("Penilaian DPL:", JSON.stringify(pengajuan.penilaian_dpl, null, 2));

  process.exit(0);
}

run();
