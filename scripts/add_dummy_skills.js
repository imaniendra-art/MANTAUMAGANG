const { default: mongoose } = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const student = await db.collection('users').findOne({ nama_lengkap: /Dwi Astrianti/i });
  const pengajuan = await db.collection('pengajuanmagangs').findOne({ mahasiswa_id: student._id, status_pengajuan: 'disetujui' });

  await db.collection('pengajuanmagangs').updateOne(
    { _id: pengajuan._id },
    { $set: { "penilaian_dpl.approved_skills": ["Public Speaking", "Data Analysis", "Microsoft Excel", "Time Management", "Problem Solving"] } }
  );

  console.log("Dummy skills added to penilaian_dpl!");
  process.exit(0);
}

run();
