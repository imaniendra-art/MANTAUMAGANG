import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PengajuanMagang from '@/models/PengajuanMagang';
import Logbook from '@/models/Logbook';
import PaketMatkul from '@/models/PaketMatkul';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get('mentorId');
    
    if (!mentorId) return NextResponse.json({ error: "Missing mentorId" }, { status: 400 });
    
    const pengajuans = await PengajuanMagang.find({ mentor_id: mentorId, status_pengajuan: 'disetujui' })
      .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn' })
      .populate('paket_matkul_id')
      .lean();
      
    const results = await Promise.all(pengajuans.map(async (p) => {
      const logs = await Logbook.find({ 
        pengajuan_id: p._id, 
        status_validasi: 'divalidasi_dpl' 
      }).select('nilai_otomatis matched_indicators');
      
      let total = 0;
      let count = logs.length;
      const allMatched = [];
      logs.forEach(l => {
        total += l.nilai_otomatis || 0;
        if (l.matched_indicators) allMatched.push(...l.matched_indicators);
      });
      
      const computedScore = count > 0 ? Math.round(total / count) : 0;

      const preview_matkul = [];
      if (p.paket_matkul_id && p.paket_matkul_id.mata_kuliah) {
        p.paket_matkul_id.mata_kuliah.forEach(mk => {
          let mkIndicators = [];
          if (mk.cpmk) {
            mk.cpmk.forEach(c => mkIndicators.push(...c.indikator));
          }
          let matchCount = mkIndicators.reduce((sum, ind) => sum + allMatched.filter(m => m.indikator === ind).length, 0);
          let baseScore = 50 + (Math.min(matchCount, 5) / 5) * 50;
          
          preview_matkul.push({
            kode_mk: mk.kode,
            nama_mk: mk.nama,
            sks: mk.sks,
            base_score: baseScore
          });
        });
      }
      
      return {
        ...p,
        computed_rekomendasi: computedScore,
        logbook_count: count,
        preview_matkul
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
    const { id, kedisiplinan, tanggung_jawab, komunikasi_tim, catatan } = data;
    
    if (!id || kedisiplinan === undefined || tanggung_jawab === undefined || komunikasi_tim === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const updated = await PengajuanMagang.findByIdAndUpdate(
      id,
      { 
        penilaian_mentor: {
          kedisiplinan,
          tanggung_jawab,
          komunikasi_tim,
          catatan
        }
      },
      { new: true }
    );
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
