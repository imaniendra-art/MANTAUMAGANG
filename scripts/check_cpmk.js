const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./models/User');
  const Logbook = require('./models/Logbook');
  const Pengajuan = require('./models/PengajuanMagang');
  const PaketMatkul = require('./models/PaketMatkul');

  const farah = await User.findOne({ nama_lengkap: /Farah Febrianti/i });
  if (!farah) {
    console.log("Farah not found");
    process.exit();
  }

  const pengajuan = await Pengajuan.findOne({ mahasiswa_id: farah._id, status_pengajuan: 'disetujui' }).populate('paket_matkul_id');
  
  if (!pengajuan) {
    console.log("Pengajuan not found");
    process.exit();
  }

  const totalCpmk = pengajuan.paket_matkul_id?.cpmk?.length || 0;
  console.log(`Total CPMK in Paket Matkul: ${totalCpmk}`);

  const logbooks = await Logbook.find({ mahasiswa_id: farah._id });
  console.log(`Total Logbooks: ${logbooks.length}`);

  const uniqueCpmkMatched = new Set();
  
  logbooks.forEach(log => {
    if (log.matched_indicators && Array.isArray(log.matched_indicators)) {
      log.matched_indicators.forEach(ind => {
        uniqueCpmkMatched.add(ind.cpmk_id?.toString() || ind.nama_cpmk);
      });
    }
  });

  console.log(`Total Unique CPMK Fulfilled: ${uniqueCpmkMatched.size}`);
  console.log(`List of CPMK fulfilled:`, Array.from(uniqueCpmkMatched));

  process.exit();
}

check();
