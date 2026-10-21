export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PengajuanMagang from '@/models/PengajuanMagang';
import User from '@/models/User';
import PaketMatkul from '@/models/PaketMatkul';
import fs from 'fs';
import path from 'path';
import { saveBase64File, deleteLocalFile } from '@/lib/storage';

export async function POST(req) {
  await dbConnect();
  try {
    const contentType = req.headers.get('content-type') || '';
    let payload = {};
    let file_cv_path = '';

    const Periode = (await import('@/models/Periode')).default;
    const activePeriode = await Periode.findOne({ is_active: true });
    const durasiBulan = activePeriode?.durasi_bulan || 4;

    const tglMulai = new Date();
    const tglSelesai = new Date();
    tglSelesai.setMonth(tglSelesai.getMonth() + durasiBulan);

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      // Extract all form values
      payload = {
        mahasiswa_id: formData.get('mahasiswa_id'),
        mitra_id: formData.get('mitra_id') || undefined,
        posisi_id: formData.get('posisi_id') || undefined,
        paket_matkul_id: formData.get('paket_matkul_id') || undefined,
        jenis_skema: formData.get('jenis_skema') || 'instansi',
        detail_tempat: {
          nama: formData.get('mitra_nama') || 'Instansi Mitra',
          alamat: formData.get('mitra_alamat') || 'Alamat Mitra',
          posisi: formData.get('posisi_nama') || 'Posisi Magang'
        },
        tanggal_mulai: tglMulai,
        tanggal_selesai: tglSelesai,
      };

      const file_cv = formData.get('file_cv') || formData.get('file');
      if (file_cv && typeof file_cv === 'object') {
        const bytes = await file_cv.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const base64Data = `data:${file_cv.type || 'application/pdf'};base64,${buffer.toString('base64')}`;
        file_cv_path = await saveBase64File(base64Data, 'cv');
      }
    } else {
      payload = await req.json();
      file_cv_path = payload.file_cv_path || '';
    }

    const User = (await import('@/models/User')).default;
    
    // Pemetaan Paket Matkul berdasarkan konsentrasi mahasiswa
    let paket_matkul_id = payload.paket_matkul_id;
    if (!paket_matkul_id && payload.mahasiswa_id) {
      const mhsData = await User.findById(payload.mahasiswa_id).select('konsentrasi program_studi');
      if (mhsData?.konsentrasi) {
        const matchedPaket = await PaketMatkul.findOne({
          $or: [
            { konsentrasi: mhsData.konsentrasi },
            { nama_paket: { $regex: new RegExp(mhsData.konsentrasi, 'i') } }
          ],
          jenis_skema: 'instansi'
        });
        if (matchedPaket) paket_matkul_id = matchedPaket._id;
      }
      if (!paket_matkul_id) {
        const instansiPaket = await PaketMatkul.findOne({ jenis_skema: 'instansi' });
        if (instansiPaket) paket_matkul_id = instansiPaket._id;
      }
      if (!paket_matkul_id) {
        const anyPaket = await PaketMatkul.findOne();
        if (anyPaket) paket_matkul_id = anyPaket._id;
      }
    }

    const pengajuan = await PengajuanMagang.create({
      ...payload,
      paket_matkul_id,
      file_cv_path,
      status_pengajuan: 'menunggu'
    });
    
    return NextResponse.json(pengajuan, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const mhsId = searchParams.get('mhsId');
    const isAdmin = searchParams.get('admin');
    const pengajuanId = searchParams.get('pengajuanId');
    
    // Fetch specific pengajuan by ID
    if (pengajuanId) {
      const pengajuan = await PengajuanMagang.findById(pengajuanId)
        .populate('paket_matkul_id')
        .populate({ path: 'dpl_id', select: 'nama_lengkap nomor_hp nim_nidn nidn' })
        .populate({ path: 'mentor_id', select: 'nama_lengkap nomor_hp nim_nidn nidn' })
        .populate({ path: 'posisi_id', populate: { path: 'mitra_id' } })
        .populate('mitra_id')
        .populate('mahasiswa_id')
        .lean();
        
      if (!pengajuan) {
        return NextResponse.json(null);
      }
      
      // Cari peserta lain yang magang di tempat yang sama
      let query = { 
        status_pengajuan: 'disetujui'
      };
      
      // Filter berdasarkan instansi/mitra yang sama
      if (pengajuan.mitra_id) {
        query.mitra_id = pengajuan.mitra_id._id;
      } else if (pengajuan.detail_tempat && pengajuan.detail_tempat.nama) {
        query['detail_tempat.nama'] = pengajuan.detail_tempat.nama;
      }
      
      // Filter berdasarkan paket matkul yang sama (batch yang sama)
      if (pengajuan.paket_matkul_id) {
        query.paket_matkul_id = pengajuan.paket_matkul_id._id;
      }

      const peserta = await PengajuanMagang.find(query)
        .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn program_studi konsentrasi' })
        .populate({ path: 'dpl_id', select: 'nama_lengkap nidn nim_nidn' })
        .sort({ createdAt: 1 })
        .lean();

      pengajuan.peserta_grup = peserta;

      return NextResponse.json(pengajuan);
    }
    
    // Tarik semua pengajuan berdasarkan status untuk Admin (default: menunggu)
    if (isAdmin === 'true') {
      const status = searchParams.get('status') || 'menunggu';
      const pengajuans = await PengajuanMagang.find({ status_pengajuan: status })
        .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn program_studi konsentrasi nomor_hp' })
        .populate({ path: 'paket_matkul_id', select: 'nama_paket' })
        .populate({ path: 'dpl_id', select: 'nama_lengkap nomor_hp nim_nidn nidn' })
        .populate({ path: 'mentor_id', select: 'nama_lengkap nomor_hp nim_nidn nidn' })
        .populate({ 
          path: 'posisi_id', 
          select: 'konsentrasi nama_posisi mitra_id',
          populate: { path: 'mitra_id', select: 'nama_instansi' }
        })
        .populate({ path: 'mitra_id', select: 'nama_instansi' })
        .sort({ createdAt: 1 })
        .lean();
        
      return NextResponse.json(pengajuans);
    }
    
    // Status untuk mahasiswa tertentu
    if (mhsId) {
      const pengajuan = await PengajuanMagang.findOne({ mahasiswa_id: mhsId })
        .populate('paket_matkul_id')
        .populate({ path: 'dpl_id', select: 'nama_lengkap nomor_hp nim_nidn nidn' })
        .populate({ path: 'mentor_id', select: 'nama_lengkap nomor_hp nim_nidn nidn' })
        .populate({ path: 'posisi_id', populate: { path: 'mitra_id' } })
        .populate('mitra_id')
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json(pengajuan || null);
    }
    
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    const data = await req.json();
    const { id, dpl_id, paket_matkul_id, status_pengajuan, alasan_penolakan } = data;
    
    if (!id || !status_pengajuan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (status_pengajuan === 'disetujui' && !dpl_id) {
      return NextResponse.json({ error: "DPL ID wajib diisi" }, { status: 400 });
    }
    
    const updatePayload = { status_pengajuan };
    if (dpl_id) updatePayload.dpl_id = dpl_id;
    if (paket_matkul_id) updatePayload.paket_matkul_id = paket_matkul_id;
    if (alasan_penolakan) updatePayload.alasan_penolakan = alasan_penolakan;

    if (status_pengajuan === 'ditolak') {
      try {
        const existingPengajuan = await PengajuanMagang.findById(id);
        if (existingPengajuan && existingPengajuan.file_cv_path) {
          await deleteLocalFile(existingPengajuan.file_cv_path);
          updatePayload.file_cv_path = ""; // Kosongkan path di database agar tidak jadi sampah
        }
      } catch (err) {
        console.error("Error deleting CV on reject:", err);
      }
    }

    if (status_pengajuan === 'disetujui') {
      const existingDoc = await PengajuanMagang.findById(id);
      if (!existingDoc?.nomor_surat_pengantar) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
        
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
        
        const lastDoc = await PengajuanMagang.findOne({
          nomor_surat_pengantar: { $exists: true, $ne: "" },
          updatedAt: { $gte: startOfYear, $lte: endOfYear }
        }).sort({ updatedAt: -1 });

        let nextUrut = 1;
        if (lastDoc && lastDoc.nomor_surat_pengantar) {
          const match = lastDoc.nomor_surat_pengantar.match(/^(\d+)/);
          if (match) {
            nextUrut = parseInt(match[1], 10) + 1;
          }
        }
        
        const paddedUrut = String(nextUrut).padStart(3, '0');
        updatePayload.nomor_surat_pengantar = `${paddedUrut}/STIMI/M.B/${romanMonths[currentMonth]}/${currentYear}`;
      }
    }

    const updated = await PengajuanMagang.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, strict: false }
    );
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
