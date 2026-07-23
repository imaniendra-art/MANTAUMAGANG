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
  console.log("Dwi Astrianti ID:", user._id);
  
  const pengajuans = await db.collection('pengajuanmagangs').find({ mahasiswa_id: user._id }).toArray();
  
  for (const p of pengajuans) {
    console.log("Pengajuan ID:", p._id, "Status:", p.status_pengajuan, "Mentor ID:", p.mentor_id);
    const mentor = await db.collection('users').findOne({ _id: p.mentor_id });
    if (mentor) {
      console.log("-> Mentor Name:", mentor.nama_lengkap, "Role:", mentor.role, "NIM/NIDN:", mentor.nim_nidn);
    } else {
      console.log("-> Mentor NOT FOUND in users collection!");
    }
  }

  process.exit(0);
}
run().catch(console.error);
