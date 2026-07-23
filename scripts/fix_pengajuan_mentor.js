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
  
  // Find Dwi Astrianti
  const user = await db.collection('users').findOne({ nama_lengkap: /Dwi Astrianti/i });
  
  // Find Kamaruddin with nim 12341234
  const mentor1234 = await db.collection('users').findOne({ nama_lengkap: /Kamaruddin Joko/i, nim_nidn: '12341234' });
  
  // Update Pengajuan disetujui to use the correct mentor ID
  await db.collection('pengajuanmagangs').updateOne(
    { mahasiswa_id: user._id, status_pengajuan: 'disetujui' },
    { $set: { mentor_id: mentor1234._id } }
  );
  
  console.log("Updated Pengajuan disetujui to use Mentor 12341234!");
  
  // Delete the other Pengajuan so it doesn't cause confusion
  await db.collection('pengajuanmagangs').deleteMany({ mahasiswa_id: user._id, status_pengajuan: 'ditolak' });
  
  process.exit(0);
}
run().catch(console.error);
