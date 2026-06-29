import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Logbook from '@/models/Logbook';

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const mhsId = searchParams.get('mhsId');
    
    if (!mhsId) return NextResponse.json({ error: "Missing mhsId" }, { status: 400 });
    
    // Tarik 3 logbook terakhir yang sudah divalidasi
    const logs = await Logbook.find({ 
      mahasiswa_id: mhsId, 
      status_validasi: { $in: ['divalidasi_mentor', 'divalidasi_dpl'] } 
    })
    .sort({ tanggal: -1, createdAt: -1 })
    .limit(3);
    
    let peringatan_monoton = false;
    
    // Algoritma Anti-Monoton
    if (logs.length === 3) {
      const ind1 = logs[0].indikator_id;
      if (ind1 && ind1 === logs[1].indikator_id && ind1 === logs[2].indikator_id) {
        peringatan_monoton = true;
      }
    }
    
    return NextResponse.json({
      peringatan_monoton,
      recent_logs: logs
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
