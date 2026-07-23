const mongoose = require('mongoose');

// Mongoose Models
const UserSchema = new mongoose.Schema({
  role: String,
  is_active: Boolean
}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const PengajuanMagangSchema = new mongoose.Schema({}, { strict: false });
const PengajuanMagang = mongoose.models.PengajuanMagang || mongoose.model('PengajuanMagang', PengajuanMagangSchema, 'pengajuanmagangs');

const LogbookSchema = new mongoose.Schema({}, { strict: false });
const Logbook = mongoose.models.Logbook || mongoose.model('Logbook', LogbookSchema, 'logbooks');

const EvaluasiDplSchema = new mongoose.Schema({}, { strict: false });
const EvaluasiDpl = mongoose.models.EvaluasiDpl || mongoose.model('EvaluasiDpl', EvaluasiDplSchema, 'evaluasidpls');

const EvaluasiMentorSchema = new mongoose.Schema({}, { strict: false });
const EvaluasiMentor = mongoose.models.EvaluasiMentor || mongoose.model('EvaluasiMentor', EvaluasiMentorSchema, 'evaluasimentors');

const LaporanAkhirSchema = new mongoose.Schema({}, { strict: false });
const LaporanAkhir = mongoose.models.LaporanAkhir || mongoose.model('LaporanAkhir', LaporanAkhirSchema, 'laporanakhirs');

const PosisiMagangSchema = new mongoose.Schema({
  pendaftar_terpilih: Number
}, { strict: false });
const PosisiMagang = mongoose.models.PosisiMagang || mongoose.model('PosisiMagang', PosisiMagangSchema, 'posisimagangs');

const MitraSchema = new mongoose.Schema({}, { strict: false });
const Mitra = mongoose.models.Mitra || mongoose.model('Mitra', MitraSchema, 'mitras');

async function cleanDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is missing in environment variables.");
    }
    
    await mongoose.connect(uri);
    console.log("Connected to DB...");

    // 1. Reset Akun
    console.log("Mengembalikan mahasiswa dan DPL menjadi non aktif...");
    await User.updateMany({ role: { $in: ['mahasiswa', 'dpl'] } }, { $set: { is_active: false } });

    console.log("Menghapus semua akun mentor...");
    await User.deleteMany({ role: 'mentor' });

    // 2. Hapus semua transaksi
    console.log("Menghapus data PengajuanMagang...");
    await PengajuanMagang.deleteMany({});

    console.log("Menghapus data Logbook...");
    await Logbook.deleteMany({});

    console.log("Menghapus data EvaluasiDpl...");
    await EvaluasiDpl.deleteMany({});

    console.log("Menghapus data EvaluasiMentor...");
    await EvaluasiMentor.deleteMany({});

    console.log("Menghapus data LaporanAkhir...");
    await LaporanAkhir.deleteMany({});
    
    // Asumsi Notifikasi jika ada
    try { await mongoose.connection.collection('notifikasis').deleteMany({}); } catch(e){}
    try { await mongoose.connection.collection('notifikasi').deleteMany({}); } catch(e){}

    // 3. Reset Posisi (Slot Terisi ke 0)
    console.log("Mereset kuota terpilih di PosisiMagang menjadi 0...");
    await PosisiMagang.updateMany({}, { $set: { pendaftar_terpilih: 0 } });

    console.log("Selesai sapu bersih transaksi! Master Data dan Lokasi/Posisi aman.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

cleanDB();
