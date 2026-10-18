import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

  const user = await db.collection('users').findOne({ nim_nidn: '2461201020' });
  if (!user) {
    console.error("User 2461201020 not found!");
    process.exit(1);
  }

  console.log("Found student:", user.nama_lengkap, "ID:", user._id.toString());
  console.log("Current state:", {
    email: user.email,
    isFirstLogin: user.isFirstLogin,
    konsentrasi: user.konsentrasi,
    kegiatan: user.kegiatan,
    nomor_hp: user.nomor_hp
  });

  const userId = user._id;

  // 1. Check and delete PengajuanMagang
  const pengajuanList = await db.collection('pengajuanmagangs').find({ mahasiswa_id: userId }).toArray();
  console.log(`Found ${pengajuanList.length} PengajuanMagang records.`);
  const pengajuanIds = pengajuanList.map(p => p._id);

  // 2. Check Logbook
  const logbooks = await db.collection('logbooks').find({
    $or: [{ mahasiswa_id: userId }, { pengajuan_id: { $in: pengajuanIds } }]
  }).toArray();
  console.log(`Found ${logbooks.length} Logbook records.`);

  // 3. Check Absensi
  const absensi = await db.collection('absensis').find({
    $or: [{ mahasiswa_id: userId }, { pengajuan_id: { $in: pengajuanIds } }]
  }).toArray();
  console.log(`Found ${absensi.length} Absensi records.`);

  // 4. Check LaporanAkhir
  const laporan = await db.collection('laporanakhirs').find({
    $or: [{ mahasiswa_id: userId }, { pengajuan_id: { $in: pengajuanIds } }]
  }).toArray();
  console.log(`Found ${laporan.length} LaporanAkhir records.`);

  // 5. Check RencanaKerja
  const rencana = await db.collection('rencanakerjas').find({ mahasiswa_id: userId }).toArray();
  console.log(`Found ${rencana.length} RencanaKerja records.`);

  // 6. Check LogAktivitas
  const logAkt = await db.collection('logaktivitas').find({ mahasiswa_id: userId }).toArray();
  console.log(`Found ${logAkt.length} LogAktivitas records.`);

  // Delete records
  if (logbooks.length > 0) {
    const res = await db.collection('logbooks').deleteMany({
      $or: [{ mahasiswa_id: userId }, { pengajuan_id: { $in: pengajuanIds } }]
    });
    console.log(`Deleted ${res.deletedCount} logbooks.`);
  }

  if (absensi.length > 0) {
    const res = await db.collection('absensis').deleteMany({
      $or: [{ mahasiswa_id: userId }, { pengajuan_id: { $in: pengajuanIds } }]
    });
    console.log(`Deleted ${res.deletedCount} absensi.`);
  }

  if (laporan.length > 0) {
    const res = await db.collection('laporanakhirs').deleteMany({
      $or: [{ mahasiswa_id: userId }, { pengajuan_id: { $in: pengajuanIds } }]
    });
    console.log(`Deleted ${res.deletedCount} laporan akhir.`);
  }

  if (rencana.length > 0) {
    const res = await db.collection('rencanakerjas').deleteMany({ mahasiswa_id: userId });
    console.log(`Deleted ${res.deletedCount} rencana kerja.`);
  }

  if (logAkt.length > 0) {
    const res = await db.collection('logaktivitas').deleteMany({ mahasiswa_id: userId });
    console.log(`Deleted ${res.deletedCount} log aktivitas.`);
  }

  if (pengajuanList.length > 0) {
    const res = await db.collection('pengajuanmagangs').deleteMany({ mahasiswa_id: userId });
    console.log(`Deleted ${res.deletedCount} pengajuan magang.`);
  }

  // Reset User
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const updateRes = await db.collection('users').updateOne(
    { _id: userId },
    {
      $set: {
        password: defaultPasswordHash,
        isFirstLogin: true,
        konsentrasi: "",
        kegiatan: "",
        nomor_hp: ""
      }
    }
  );
  console.log("Updated user record:", updateRes.modifiedCount);

  const updatedUser = await db.collection('users').findOne({ _id: userId });
  console.log("Reset completed successfully:", {
    nim: updatedUser.nim_nidn,
    nama: updatedUser.nama_lengkap,
    email: updatedUser.email,
    isFirstLogin: updatedUser.isFirstLogin,
    konsentrasi: updatedUser.konsentrasi,
    kegiatan: updatedUser.kegiatan,
    nomor_hp: updatedUser.nomor_hp
  });

  await mongoose.disconnect();
}

run().catch(err => {
  console.error("Error resetting student:", err);
  process.exit(1);
});
