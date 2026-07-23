const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1];
      let val = match[2];
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ nama_lengkap: /Dwi Astrianti/i });
  const pengajuan = await db.collection('pengajuanmagangs').findOne({ mahasiswa_id: user._id });
  console.log("Pengajuan ID:", pengajuan._id);
  console.log("DPL ID:", pengajuan.dpl_id);
  console.log("Mentor ID:", pengajuan.mentor_id);
  process.exit(0);
}
run().catch(console.error);
