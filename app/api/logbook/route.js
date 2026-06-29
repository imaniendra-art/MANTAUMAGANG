import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Logbook from '@/models/Logbook';
import PengajuanMagang from '@/models/PengajuanMagang';
import User from '@/models/User'; 

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const mhsId = searchParams.get('mhsId');
    const role = searchParams.get('role');
    const userId = searchParams.get('userId'); 
    
    // Tarik logbook khusus 1 mahasiswa
    if (mhsId) {
      const logs = await Logbook.find({ mahasiswa_id: mhsId }).sort({ tanggal: -1, createdAt: -1 });
      return NextResponse.json(logs);
    }

    // Mentor: Tarik semua logbook yang menunggu validasi lapangan
    if (role === 'mentor') {
      const logs = await Logbook.find({ status_validasi: 'menunggu_mentor' })
        .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn' })
        .populate({ path: 'pengajuan_id', select: 'detail_tempat' })
        .sort({ tanggal: 1 });
      return NextResponse.json(logs);
    }

    // Mentor Histori: Tarik semua logbook yang sudah tidak pending (riwayat)
    if (role === 'mentor_histori') {
      const logs = await Logbook.find({ status_validasi: { $in: ['divalidasi_mentor', 'divalidasi_dpl', 'revisi'] } })
        .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn' })
        .populate({ path: 'pengajuan_id', select: 'detail_tempat' })
        .sort({ tanggal: -1 });
      return NextResponse.json(logs);
    }

    // DPL: Tarik logbook yang sudah di-acc mentor, KHUSUS untuk mhs bimbingannya
    if (role === 'dpl' && userId) {
      const pengajuans = await PengajuanMagang.find({ dpl_id: userId }).select('_id');
      const pengajuanIds = pengajuans.map(p => p._id);

      const logs = await Logbook.find({ 
        pengajuan_id: { $in: pengajuanIds }
      })
      .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn' })
      .sort({ tanggal: 1 });

      return NextResponse.json(logs);
    }
    
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const data = await req.json();
    const newLog = await Logbook.create(data);
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    const data = await req.json();
    const { id, status_validasi } = data;
    
    if (!id || !status_validasi) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    let updateData = { status_validasi };
    if (status_validasi === 'divalidasi_mentor') {
      const logbook = await Logbook.findById(id);
      if (logbook && logbook.matched_indicators) {
        updateData.nilai_otomatis = logbook.matched_indicators.length * 10; // 10 poin per indikator
      }
    }
    
    const updated = await Logbook.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
