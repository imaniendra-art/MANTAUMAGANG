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

const Logbook = require('./models/Logbook');
const PengajuanMagang = require('./models/PengajuanMagang');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const userId = '6a60d90a317d1e8f2197d1e3'; // Mentor 12341234

  const pengajuans = await PengajuanMagang.find({ mentor_id: userId }).select('_id');
  console.log("Pengajuan Ids:", pengajuans);
  
  const pengajuanIds = pengajuans.map(p => p._id);
  
  const logs = await Logbook.find({ 
    status_validasi: 'menunggu_mentor',
    pengajuan_id: { $in: pengajuanIds }
  });
  
  console.log("Logbook Count:", logs.length);
  process.exit(0);
}
run().catch(console.error);
