import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PengajuanMagang from '@/models/PengajuanMagang';
import Logbook from '@/models/Logbook';

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const dplId = searchParams.get('dplId');
    
    if (!dplId) return NextResponse.json({ error: "Missing dplId" }, { status: 400 });
    
    const pengajuans = await PengajuanMagang.find({ dpl_id: dplId, status_pengajuan: 'disetujui' })
      .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn' })
      .lean();
      
    const results = await Promise.all(pengajuans.map(async (p) => {
      const logs = await Logbook.find({ 
        pengajuan_id: p._id, 
        status_validasi: 'divalidasi_dpl' 
      }).select('nilai_otomatis');
      
      let total = 0;
      let count = logs.length;
      
      logs.forEach(l => {
        total += l.nilai_otomatis || 0;
      });
      
      const computedScore = count > 0 ? Math.round(total / count) : 0;
      
      return {
        ...p,
        computed_rekomendasi: computedScore,
        logbook_count: count
      };
    }));
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    const data = await req.json();
    const { id, nilai_rekomendasi_sistem, nilai_akhir_mutlak, catatan_evaluasi } = data;
    
    if (!id || nilai_akhir_mutlak === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const updated = await PengajuanMagang.findByIdAndUpdate(
      id,
      { nilai_rekomendasi_sistem, nilai_akhir_mutlak, catatan_evaluasi },
      { new: true }
    );
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
