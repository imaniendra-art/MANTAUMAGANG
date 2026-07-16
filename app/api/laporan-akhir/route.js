export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PengajuanMagang from '@/models/PengajuanMagang';
import LaporanAkhir from '@/models/LaporanAkhir';
import PaketMatkul from '@/models/PaketMatkul';
import MitraMagang from '@/models/MitraMagang';
import Logbook from '@/models/Logbook';
import { uploadToMinio, deleteFromMinio } from '@/lib/minio';
export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const mhsId = searchParams.get('mhsId');
    const role = searchParams.get('role');
    const dplId = searchParams.get('dplId');

    // Jika dipanggil oleh DPL
    if (role === 'dpl' && dplId) {
      // Cari semua pengajuan bimbingan DPL tersebut
      const pengajuans = await PengajuanMagang.find({ dpl_id: dplId }).select('_id');
      const pengajuanIds = pengajuans.map(p => p._id);

      // Cari semua laporan akhir yang statusnya bukan draft
      const laporans = await LaporanAkhir.find({ 
        pengajuan_id: { $in: pengajuanIds },
        status: { $in: ['submitted', 'revisi', 'disetujui'] }
      })
      .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn program_studi' })
      .populate({ path: 'pengajuan_id', select: 'mitra_id detail_tempat posisi_id', populate: { path: 'posisi_id mitra_id' } })
      .sort({ updatedAt: -1 });

      return NextResponse.json(laporans);
    }

    // Jika dipanggil oleh Mahasiswa
    if (!mhsId) {
      return NextResponse.json({ error: "Missing mhsId" }, { status: 400 });
    }

    const pengajuan = await PengajuanMagang.findOne({ mahasiswa_id: mhsId, status_pengajuan: 'disetujui' })
      .populate('paket_matkul_id')
      .populate('mitra_id')
      .populate('mahasiswa_id');
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

    const logbooks = await Logbook.find({ pengajuan_id: pengajuan._id }).sort({ tanggal: 1 });

    return NextResponse.json({ laporan, pengajuan, logbooks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
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
      file_struktur_organisasi,
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

    // Helper untuk menangani upload file MinIO
    const handleFileUpload = async (base64Data, oldUrl, folder) => {
      if (base64Data && base64Data.startsWith('data:')) {
        if (oldUrl) {
          try { await deleteFromMinio(oldUrl); } catch (e) { console.error("Error deleting old file:", e); }
        }
        return await uploadToMinio(base64Data, folder);
      }
      return base64Data;
    };

    const newPengantar = file_pengantar !== undefined ? await handleFileUpload(file_pengantar, laporan?.file_pengantar, 'laporan/pengantar') : undefined;
    const newPenerimaan = file_penerimaan !== undefined ? await handleFileUpload(file_penerimaan, laporan?.file_penerimaan, 'laporan/penerimaan') : undefined;
    const newKeterangan = file_keterangan !== undefined ? await handleFileUpload(file_keterangan, laporan?.file_keterangan, 'laporan/keterangan') : undefined;
    const newStruktur = file_struktur_organisasi !== undefined ? await handleFileUpload(file_struktur_organisasi, laporan?.file_struktur_organisasi, 'laporan/struktur') : undefined;

    if (laporan) {
      // Update
      laporan.bab1_pendahuluan = bab1_pendahuluan ?? laporan.bab1_pendahuluan;
      laporan.bab2_profil = bab2_profil ?? laporan.bab2_profil;
      laporan.bab3_aktivitas = bab3_aktivitas ?? laporan.bab3_aktivitas;
      laporan.bab4_permasalahan = bab4_permasalahan ?? laporan.bab4_permasalahan;
      laporan.bab5_kesimpulan = bab5_kesimpulan ?? laporan.bab5_kesimpulan;
      laporan.bab6_refleksi = bab6_refleksi ?? laporan.bab6_refleksi;
      laporan.file_pengantar = newPengantar !== undefined ? newPengantar : laporan.file_pengantar;
      laporan.file_penerimaan = newPenerimaan !== undefined ? newPenerimaan : laporan.file_penerimaan;
      laporan.file_keterangan = newKeterangan !== undefined ? newKeterangan : laporan.file_keterangan;
      laporan.file_struktur_organisasi = newStruktur !== undefined ? newStruktur : laporan.file_struktur_organisasi;
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
        file_pengantar: newPengantar,
        file_penerimaan: newPenerimaan,
        file_keterangan: newKeterangan,
        file_struktur_organisasi: newStruktur,
        status: status || 'draft'
      });
    }

    return NextResponse.json(laporan);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  await dbConnect();
  try {
    const data = await request.json();
    const { id, status, catatan_dpl } = data;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const laporan = await LaporanAkhir.findById(id);
    if (!laporan) {
      return NextResponse.json({ error: "Laporan not found" }, { status: 404 });
    }

    laporan.status = status;
    if (catatan_dpl !== undefined) {
      laporan.catatan_dpl = catatan_dpl;
    }

    await laporan.save();
    return NextResponse.json(laporan);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
