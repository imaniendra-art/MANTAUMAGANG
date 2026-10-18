import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set!");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI, { dbName: 'mantaumagang' });
  console.log("Connected to MongoDB mantaumagang");

  const db = mongoose.connection.db;

  const resLogbooks = await db.collection('logbooks').deleteMany({});
  console.log(`Deleted ${resLogbooks.deletedCount} logbooks.`);

  const resAbsensi = await db.collection('absensis').deleteMany({});
  console.log(`Deleted ${resAbsensi.deletedCount} absensi.`);

  const resLaporan = await db.collection('laporanakhirs').deleteMany({});
  console.log(`Deleted ${resLaporan.deletedCount} laporan akhir.`);

  const resRencana = await db.collection('rencanakerjas').deleteMany({});
  console.log(`Deleted ${resRencana.deletedCount} rencana kerja.`);

  const resLogAkt = await db.collection('logaktivitas').deleteMany({});
  console.log(`Deleted ${resLogAkt.deletedCount} log aktivitas.`);

  const resPengajuan = await db.collection('pengajuanmagangs').deleteMany({});
  console.log(`Deleted ${resPengajuan.deletedCount} pengajuan magang.`);

  // Reset all students to isFirstLogin: true
  const resStudents = await db.collection('users').updateMany(
    { role: 'mahasiswa' },
    {
      $set: {
        isFirstLogin: true,
        konsentrasi: "",
        kegiatan: "",
        nomor_hp: ""
      }
    }
  );
  console.log(`Reset ${resStudents.modifiedCount} student accounts to initial first login state.`);

  await mongoose.disconnect();
  console.log("Database transaction cleanup complete!");
}

run().catch(err => {
  console.error("Error during transaction cleanup:", err);
  process.exit(1);
});
