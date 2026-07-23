import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PengajuanMagang from '@/models/PengajuanMagang';
import LaporanAkhir from '@/models/LaporanAkhir';

export async function GET() {
  try {
    await dbConnect();
    
    // 1. Ambil Surat Pengantar
    const pengajuans = await PengajuanMagang.find({ status_pengajuan: 'disetujui' })
      .populate('mahasiswa_id', 'nama_lengkap nim_nidn')
      .lean();
      
    const ttdPengantar = pengajuans.map(p => ({
      _id: p._id.toString() + '-pengantar',
      dokumen_id: p._id.toString(),
      jenis: 'Surat Pengantar Magang',
      type: 'pengantar',
      mahasiswa: p.mahasiswa_id?.nama_lengkap,
      nim: p.mahasiswa_id?.nim_nidn,
      tanggal: p.updatedAt,
      nomor_surat: p.nomor_surat_pengantar
    }));

    // 2. Ambil Lembar Pengesahan & Transkrip dari LaporanAkhir
    const laporans = await LaporanAkhir.find({ 
      $or: [
        { status_validasi_dpl: 'disetujui' },
        { status: 'submitted' },
        { status: 'disetujui' }
      ]
    })
      .populate('mahasiswa_id', 'nama_lengkap nim_nidn')
      .lean();

    const ttdPengesahan = laporans.map(l => ({
      _id: l._id.toString() + '-pengesahan',
      dokumen_id: l._id.toString(),
      jenis: 'Lembar Pengesahan Laporan',
      type: 'pengesahan',
      mahasiswa: l.mahasiswa_id?.nama_lengkap,
      nim: l.mahasiswa_id?.nim_nidn,
      tanggal: l.updatedAt
    }));

    const ttdTranskrip = laporans.map(l => ({
      _id: l._id.toString() + '-transkrip',
      dokumen_id: l._id.toString(),
      jenis: 'Transkrip Nilai (SKPI)',
      type: 'transkrip',
      mahasiswa: l.mahasiswa_id?.nama_lengkap,
      nim: l.mahasiswa_id?.nim_nidn,
      tanggal: l.updatedAt
    }));

    const ttdSertifikat = laporans.map(l => ({
      _id: l._id.toString() + '-sertifikat',
      dokumen_id: l._id.toString(),
      jenis: 'Sertifikat Magang Berdampak',
      type: 'sertifikat',
      mahasiswa: l.mahasiswa_id?.nama_lengkap,
      nim: l.mahasiswa_id?.nim_nidn,
      tanggal: l.updatedAt
    }));

    const ttdPenilaianDpl = laporans.map(l => ({
      _id: l._id.toString() + '-penilaian-dpl',
      dokumen_id: l._id.toString(),
      jenis: 'Daftar Penilaian Magang (DPL)',
      type: 'penilaian-dpl',
      mahasiswa: l.mahasiswa_id?.nama_lengkap,
      nim: l.mahasiswa_id?.nim_nidn,
      tanggal: l.updatedAt
    }));

    const ttdPenilaianMentor = laporans.map(l => ({
      _id: l._id.toString() + '-penilaian-mentor',
      dokumen_id: l._id.toString(),
      jenis: 'Daftar Penilaian Magang (Mentor)',
      type: 'penilaian-mentor',
      mahasiswa: l.mahasiswa_id?.nama_lengkap,
      nim: l.mahasiswa_id?.nim_nidn,
      tanggal: l.updatedAt
    }));

    // Gabungkan dan urutkan dari yang terbaru
    const allTtd = [...ttdPengantar, ...ttdPengesahan, ...ttdTranskrip, ...ttdSertifikat, ...ttdPenilaianDpl, ...ttdPenilaianMentor]
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    return NextResponse.json(allTtd);
  } catch (error) {
    console.error("Error fetching TTD Digital:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
