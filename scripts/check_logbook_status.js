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
  
  const p_id = new mongoose.Types.ObjectId('6a6038121478cdbbc71465b5');
  const count = await db.collection('logbooks').countDocuments({ pengajuan_id: p_id, status_validasi: 'menunggu_mentor' });
  console.log("Logbooks menunggu_mentor:", count);
  
  const sample = await db.collection('logbooks').findOne({ pengajuan_id: p_id });
  console.log("Sample logbook:", sample);
  
  process.exit(0);
}
run().catch(console.error);
