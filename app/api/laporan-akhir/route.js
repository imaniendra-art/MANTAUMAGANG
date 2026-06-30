export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import PengajuanMagang from '@/models/PengajuanMagang';
import LaporanAkhir from '@/models/LaporanAkhir';
import PaketMatkul from '@/models/PaketMatkul';
import MitraMagang from '@/models/MitraMagang';

// Ensure DB is connected
const MONGODB_URI = process.env.MONGODB_URI;
if (!mongoose.connection.readyState) {
  mongoose.connect(MONGODB_URI);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mhsId = searchParams.get('mhsId');

    if (!mhsId) {
      return NextResponse.json({ error: "Missing mhsId" }, { status: 400 });
    }

    const pengajuan = await PengajuanMagang.findOne({ mahasiswa_id: mhsId, status_pengajuan: 'disetujui' })
      .populate('paket_matkul_id')
      .populate('mitra_id');
    if (!pengajuan) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan atau belum disetujui" }, { status: 404 });
    }

    let laporan = await LaporanAkhir.findOne({ pengajuan_id: pengajuan._id });
    if (!laporan) {
      laporan = await LaporanAkhir.create({
        pengajuan_id: pengajuan._id,
        mahasiswa_id: mhsId
      });
    }

    return NextResponse.json({ laporan, pengajuan });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { 
      mhsId, 
      bab1_pendahuluan, 
      bab2_profil, 
      bab3_aktivitas, 
      bab4_permasalahan, 
      bab5_kesimpulan, 
      bab6_refleksi,
      file_pengantar,
      file_penerimaan,
      file_keterangan,
      status
    } = data;

    if (!mhsId) {
      return NextResponse.json({ error: "Missing mhsId" }, { status: 400 });
    }

    const pengajuan = await PengajuanMagang.findOne({ mahasiswa_id: mhsId, status_pengajuan: 'disetujui' });
    if (!pengajuan) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
    }

    let laporan = await LaporanAkhir.findOne({ pengajuan_id: pengajuan._id });
    if (laporan) {
      // Update
      laporan.bab1_pendahuluan = bab1_pendahuluan ?? laporan.bab1_pendahuluan;
      laporan.bab2_profil = bab2_profil ?? laporan.bab2_profil;
      laporan.bab3_aktivitas = bab3_aktivitas ?? laporan.bab3_aktivitas;
      laporan.bab4_permasalahan = bab4_permasalahan ?? laporan.bab4_permasalahan;
      laporan.bab5_kesimpulan = bab5_kesimpulan ?? laporan.bab5_kesimpulan;
      laporan.bab6_refleksi = bab6_refleksi ?? laporan.bab6_refleksi;
      laporan.file_pengantar = file_pengantar ?? laporan.file_pengantar;
      laporan.file_penerimaan = file_penerimaan ?? laporan.file_penerimaan;
      laporan.file_keterangan = file_keterangan ?? laporan.file_keterangan;
      laporan.status = status ?? laporan.status;
      await laporan.save();
    } else {
      // Create
      laporan = await LaporanAkhir.create({
        pengajuan_id: pengajuan._id,
        mahasiswa_id: mhsId,
        bab1_pendahuluan,
        bab2_profil,
        bab3_aktivitas,
        bab4_permasalahan,
        bab5_kesimpulan,
        bab6_refleksi,
        file_pengantar,
        file_penerimaan,
        file_keterangan,
        status: status || 'draft'
      });
    }

    return NextResponse.json(laporan);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
