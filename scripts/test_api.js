const { default: mongoose } = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Mentor: Tarik semua logbook yang menunggu validasi lapangan
  const userId = '6a60d90a317d1e8f2197d1e3'; // Mentor 12341234
  
  const PengajuanMagang = mongoose.connection.collection('pengajuanmagangs');
  const pengajuans = await PengajuanMagang.find({ mentor_id: new mongoose.Types.ObjectId(userId) }).toArray();
  const pengajuanIds = pengajuans.map(p => p._id);
  
  console.log("pengajuanIds", pengajuanIds);

  const Logbook = mongoose.connection.collection('logbooks');
  const logs = await Logbook.find({ 
    status_validasi: 'menunggu_mentor',
    pengajuan_id: { $in: pengajuanIds }
  }).toArray();
  
  console.log("Logs length:", logs.length);
  process.exit(0);
}
run().catch(console.error);
