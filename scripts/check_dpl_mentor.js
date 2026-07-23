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
  const kamaruddin = await db.collection('users').findOne({ nama_lengkap: /Kamaruddin/i });
  console.log("Kamaruddin ID:", kamaruddin ? kamaruddin._id : 'Not Found');
  
  const dpl = await db.collection('users').findOne({ role: 'dpl' });
  console.log("Any DPL ID:", dpl ? `${dpl._id} (${dpl.nama_lengkap})` : 'Not Found');
  process.exit(0);
}
run().catch(console.error);
