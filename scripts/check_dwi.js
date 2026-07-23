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
  
  const dwis = await db.collection('users').find({ nama_lengkap: /Dwi Astrianti/i }).toArray();
  console.log("Found Dwis:", dwis.map(u => ({ id: u._id, name: u.nama_lengkap, role: u.role, nim_nidn: u.nim_nidn })));
  
  for (const d of dwis) {
    const pengajuans = await db.collection('pengajuanmagangs').find({ mahasiswa_id: d._id }).toArray();
    console.log(`Pengajuan for ${d.nim_nidn}:`, pengajuans.map(p => ({
      id: p._id,
      status: p.status_pengajuan,
      dpl: p.dpl_id,
      mentor: p.mentor_id
    })));
  }
  
  process.exit(0);
}
run().catch(console.error);
