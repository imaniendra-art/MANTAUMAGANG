import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PengajuanMagang from '@/models/PengajuanMagang';
import User from '@/models/User';
import PaketMatkul from '@/models/PaketMatkul';
import fs from 'fs';
import path from 'path';
import { uploadToMinio } from '@/lib/minio';

export async function POST(req) {
  await dbConnect();
  try {
    const contentType = req.headers.get('content-type') || '';
    let payload = {};
    let file_cv_path = '';

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
        tanggal_mulai: new Date(),
        tanggal_selesai: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      };

      const file_cv = formData.get('file_cv') || formData.get('file');
      if (file_cv && typeof file_cv === 'object') {
        const bytes = await file_cv.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const base64Data = `data:${file_cv.type || 'application/pdf'};base64,${buffer.toString('base64')}`;
        file_cv_path = await uploadToMinio(base64Data, 'cv');
      }
    } else {
      payload = await req.json();
      file_cv_path = payload.file_cv_path || '';
    }

    // Fallback required fields for existing schema
    let paket_matkul_id = payload.paket_matkul_id;
    if (!paket_matkul_id) {
      const paket = await PaketMatkul.findOne();
      if (paket) paket_matkul_id = paket._id;
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
        .populate({ path: 'dpl_id', select: 'nama_lengkap nomor_hp' })
        .populate({ path: 'mentor_id', select: 'nama_lengkap nomor_hp' })
        .populate({ path: 'posisi_id', populate: { path: 'mitra_id' } })
        .populate('mitra_id')
        .populate('mahasiswa_id');
      return NextResponse.json(pengajuan || null);
    }
    
    // Tarik semua pengajuan berdasarkan status untuk Admin (default: menunggu)
    if (isAdmin === 'true') {
      const status = searchParams.get('status') || 'menunggu';
      const pengajuans = await PengajuanMagang.find({ status_pengajuan: status })
        .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn program_studi konsentrasi nomor_hp' })
        .populate({ path: 'paket_matkul_id', select: 'nama_paket' })
        .populate({ path: 'dpl_id', select: 'nama_lengkap nomor_hp' })
        .populate({ path: 'mentor_id', select: 'nama_lengkap nomor_hp' })
        .populate({ 
          path: 'posisi_id', 
          select: 'konsentrasi nama_posisi mitra_id',
          populate: { path: 'mitra_id', select: 'nama_instansi' }
        })
        .populate({ path: 'mitra_id', select: 'nama_instansi' })
        .sort({ createdAt: 1 });
        
      return NextResponse.json(pengajuans);
    }
    
    // Status untuk mahasiswa tertentu
    if (mhsId) {
      const pengajuan = await PengajuanMagang.findOne({ mahasiswa_id: mhsId })
        .populate('paket_matkul_id')
        .populate({ path: 'dpl_id', select: 'nama_lengkap nomor_hp' })
        .populate({ path: 'mentor_id', select: 'nama_lengkap nomor_hp' })
        .populate({ path: 'posisi_id', populate: { path: 'mitra_id' } })
        .populate('mitra_id')
        .sort({ createdAt: -1 });
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
    const { id, dpl_id, status_pengajuan, alasan_penolakan } = data;
    
    if (!id || !status_pengajuan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (status_pengajuan === 'disetujui' && !dpl_id) {
      return NextResponse.json({ error: "DPL ID wajib diisi" }, { status: 400 });
    }
    
    const updatePayload = { status_pengajuan };
    if (dpl_id) updatePayload.dpl_id = dpl_id;
    if (alasan_penolakan) updatePayload.alasan_penolakan = alasan_penolakan;

    if (status_pengajuan === 'disetujui') {
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
