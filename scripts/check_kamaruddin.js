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
  
  const kamaruddins = await db.collection('users').find({ nama_lengkap: /Kamaruddin/i }).toArray();
  console.log("Found Kamaruddins:", kamaruddins.map(u => ({ id: u._id, name: u.nama_lengkap, role: u.role, nim_nidn: u.nim_nidn })));
  
  process.exit(0);
}
run().catch(console.error);
