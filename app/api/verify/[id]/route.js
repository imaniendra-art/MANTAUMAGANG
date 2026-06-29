import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import LaporanAkhir from '@/models/LaporanAkhir';
import User from '@/models/User';
import PengajuanMagang from '@/models/PengajuanMagang';

// Ensure DB is connected
const MONGODB_URI = process.env.MONGODB_URI;
if (!mongoose.connection.readyState) {
  mongoose.connect(MONGODB_URI);
}

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ valid: false, error: "ID dokumen tidak valid" }, { status: 400 });
    }

    const laporan = await LaporanAkhir.findById(id)
      .populate('mahasiswa_id', 'nama_lengkap nim_nidn email')
      .populate({
        path: 'pengajuan_id',
        populate: { path: 'mitra_id', select: 'nama_perusahaan' }
      });

    if (!laporan) {
      return NextResponse.json({ valid: false, error: "Dokumen tidak ditemukan dalam sistem" }, { status: 404 });
    }

    // Hanya dokumen yang statusnya submitted yang dianggap valid secara publik
    if (laporan.status !== 'submitted') {
      return NextResponse.json({ valid: false, error: "Dokumen ini masih dalam status draft dan belum diterbitkan secara resmi" }, { status: 403 });
    }

    return NextResponse.json({
      valid: true,
      dokumen: {
        id: laporan._id,
        nama_mahasiswa: laporan.mahasiswa_id.nama_lengkap,
        nim: laporan.mahasiswa_id.nim_nidn,
        mitra: laporan.pengajuan_id?.mitra_id?.nama_perusahaan || laporan.pengajuan_id?.detail_tempat?.nama,
        tanggal_selesai_magang: laporan.pengajuan_id.tanggal_selesai,
        terbit_pada: laporan.updatedAt
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}
