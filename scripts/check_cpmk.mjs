import fs from 'fs';
import mongoose from 'mongoose';
import User from './models/User.js';
import Logbook from './models/Logbook.js';
import Pengajuan from './models/PengajuanMagang.js';
import PaketMatkul from './models/PaketMatkul.js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const mongoUriStr = envFile.split('\n').find(l => l.startsWith('MONGODB_URI=')).substring('MONGODB_URI='.length).replace(/\"/g, '');

async function check() {
  await mongoose.connect(mongoUriStr);

  const farah = await User.findOne({ nama_lengkap: /Farah Febrianti/i });
  if (!farah) {
    console.log('Farah not found');
    process.exit();
  }

  const pengajuan = await Pengajuan.findOne({ mahasiswa_id: farah._id, status_pengajuan: 'disetujui' }).populate('paket_matkul_id');
  
  if (!pengajuan) {
    console.log('Pengajuan not found');
    process.exit();
  }

  const totalCpmk = pengajuan.paket_matkul_id?.cpmk?.length || 0;
  console.log('Total CPMK in Paket Matkul: ' + totalCpmk);
  if (totalCpmk > 0) {
    console.log('CPMK list:');
    pengajuan.paket_matkul_id.cpmk.forEach((cpmk, idx) => console.log(idx+1, cpmk.kode, cpmk.nama));
  }

  const logbooks = await Logbook.find({ mahasiswa_id: farah._id });
  console.log('Total Logbooks: ' + logbooks.length);

  const uniqueCpmkMatched = new Set();
  
  logbooks.forEach(log => {
    if (log.matched_indicators && Array.isArray(log.matched_indicators)) {
      log.matched_indicators.forEach(ind => {
        uniqueCpmkMatched.add(ind.cpmk_id?.toString() || ind.nama_cpmk);
      });
    }
  });

  console.log('Total Unique CPMK Fulfilled: ' + uniqueCpmkMatched.size);
  console.log('List of CPMK fulfilled: ', Array.from(uniqueCpmkMatched));

  process.exit();
}
check();
