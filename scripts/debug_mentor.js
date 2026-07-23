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
  
  // Find Dwi Astrianti's Pengajuan
  const user = await db.collection('users').findOne({ nama_lengkap: /Dwi Astrianti/i });
  const pengajuans = await db.collection('pengajuanmagangs').find({ mahasiswa_id: user._id }).toArray();
  
  console.log("Pengajuan untuk Dwi Astrianti:", pengajuans.map(p => ({ id: p._id, status: p.status_pengajuan, mentor_id: p.mentor_id })));
  
  // Find Mentor 12341234
  const mentor1234 = await db.collection('users').findOne({ nim_nidn: '12341234' });
  console.log("Mentor 12341234 ID:", mentor1234._id);
  
  // Count logbooks for the pengajuan
  for (const p of pengajuans) {
    const logs = await db.collection('logbooks').find({ pengajuan_id: p._id, status_validasi: 'menunggu_mentor' }).count();
    console.log(`Logbooks for pengajuan ${p._id}:`, logs);
  }

  process.exit(0);
}
run().catch(console.error);
