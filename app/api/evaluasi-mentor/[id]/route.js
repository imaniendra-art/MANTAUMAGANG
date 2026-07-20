import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PengajuanMagang from '@/models/PengajuanMagang';
import Logbook from '@/models/Logbook';
import User from '@/models/User';
import PaketMatkul from '@/models/PaketMatkul';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    
    const pengajuan = await PengajuanMagang.findById(id)
      .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn' })
      .populate({ path: 'mentor_id', select: 'nama_lengkap' })
      .populate('paket_matkul_id')
      .lean();
      
    if (!pengajuan) {
      return NextResponse.json({ error: "Pengajuan not found" }, { status: 404 });
    }

    const logs = await Logbook.find({ 
      pengajuan_id: id, 
      status_validasi: 'divalidasi_dpl' 
    });

    // Kumpulkan semua indikator yang pernah diceklis dari logbook
    const allMatched = [];
    logs.forEach(l => {
      if (l.matched_indicators) allMatched.push(...l.matched_indicators);
    });

    const preview_matkul = [];

    // Kalkulasi Base Score per Matkul (untuk preview saja)
    if (pengajuan.paket_matkul_id && pengajuan.paket_matkul_id.mata_kuliah) {
      pengajuan.paket_matkul_id.mata_kuliah.forEach(mk => {
        let mkIndicators = [];
        if (mk.cpmk) {
          mk.cpmk.forEach(c => mkIndicators.push(...c.indikator));
        }

        let matchCount = mkIndicators.reduce((sum, ind) => sum + allMatched.filter(m => m.indikator === ind).length, 0);

        // Base Score (50 - 100) -> 5 match = max base score (100)
        let baseScore = 50 + (Math.min(matchCount, 5) / 5) * 50;

        preview_matkul.push({
          kode_mk: mk.kode,
          nama_mk: mk.nama,
          sks: mk.sks,
          base_score: baseScore
        });
      });
    }
    
    return NextResponse.json({
      pengajuan,
      preview_matkul,
      logbook_count: logs.length
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    const data = await req.json();
    const { kedisiplinan, tanggung_jawab, komunikasi_tim, catatan } = data;
    
    if (kedisiplinan === undefined || tanggung_jawab === undefined || komunikasi_tim === undefined) {
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
