import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MitraMagang from '@/models/MitraMagang';
import PosisiMagang from '@/models/PosisiMagang';
import PengajuanMagang from '@/models/PengajuanMagang';
import User from '@/models/User';

export async function GET() {
  await dbConnect();
  try {
    const totalMitra = await MitraMagang.countDocuments();
    
    // Aggregation for Posisi
    const posisiAgg = await PosisiMagang.aggregate([
      { $group: { _id: null, total: { $sum: "$kuota" } } }
    ]);
    const totalPosisiTersedia = posisiAgg[0]?.total || 0;

    const totalAjuan = await PengajuanMagang.countDocuments();
    const antreanValidasi = await PengajuanMagang.countDocuments({ status_pengajuan: 'menunggu' });
    const posisiTerisi = await PengajuanMagang.countDocuments({ status_pengajuan: 'disetujui' });

    // Aggregation for Konsentrasi Kebutuhan
    const konsentrasiStatsRaw = await PosisiMagang.aggregate([
      { $group: { _id: "$konsentrasi", count: { $sum: 1 }, kuota: { $sum: "$kuota" } } }
    ]);
    
    // Format into an array with 4 predefined keys for UI reliability
    const konsentrasiMap = {
      "SDM": 0,
      "Keuangan": 0,
      "Pemasaran": 0,
      "Pengembangan Bisnis": 0
    };
    
    konsentrasiStatsRaw.forEach(item => {
      if (konsentrasiMap[item._id] !== undefined) {
        konsentrasiMap[item._id] = item.kuota;
      }
    });
    
    const konsentrasiStats = Object.keys(konsentrasiMap).map(k => ({
      name: k,
      kuota: konsentrasiMap[k]
    }));

    // Aktivitas Cepat: 5 Log Terbaru
    const LogAktivitas = (await import('@/models/LogAktivitas')).default;
    const aktivitasTerbaru = await LogAktivitas.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Map to ensure it's serializable and safe
    const safeAktivitas = aktivitasTerbaru.map(item => ({
      _id: item._id,
      nama_mahasiswa: item.nama_mahasiswa || 'Sistem',
      aktivitas: item.aktivitas,
      status: item.status,
      waktu: item.createdAt
    }));

    return NextResponse.json({
      totalMitra,
      totalPosisiTersedia,
      totalAjuan,
      antreanValidasi,
      posisiTerisi,
      konsentrasiStats,
      aktivitasTerbaru: safeAktivitas
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
