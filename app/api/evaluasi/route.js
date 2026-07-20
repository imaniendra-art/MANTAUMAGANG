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
    const dplId = searchParams.get('dplId');
    
    if (!dplId) return NextResponse.json({ error: "Missing dplId" }, { status: 400 });
    
    const pengajuans = await PengajuanMagang.find({ dpl_id: dplId, status_pengajuan: 'disetujui' })
      .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn' })
      .populate({ path: 'mentor_id', select: 'nama_lengkap nomor_hp' })
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
    const { id, sistematika_laporan, kualitas_isi, penguasaan_materi, catatan } = data;
    
    if (!id || sistematika_laporan === undefined || kualitas_isi === undefined || penguasaan_materi === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pengajuan = await PengajuanMagang.findById(id).populate('paket_matkul_id');
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

    // Hitung rata-rata nilai Booster DPL (Skala 100, Bobot 18% dari total final)
    const dplAvg = (sistematika_laporan + kualitas_isi + penguasaan_materi) / 3;
    const weightedDpl = dplAvg * 0.18;

    // Hitung rata-rata nilai Booster Mentor (Skala 100, Bobot 12% dari total final)
    let mentorAvg = 0;
    if (pengajuan.penilaian_mentor && pengajuan.penilaian_mentor.kedisiplinan !== undefined) {
      mentorAvg = (pengajuan.penilaian_mentor.kedisiplinan + pengajuan.penilaian_mentor.tanggung_jawab + pengajuan.penilaian_mentor.komunikasi_tim) / 3;
    }
    const weightedMentor = mentorAvg * 0.12;

    const transkrip_final = [];

    // Kalkulasi nilai per Matkul
    if (pengajuan.paket_matkul_id && pengajuan.paket_matkul_id.mata_kuliah) {
      pengajuan.paket_matkul_id.mata_kuliah.forEach(mk => {
        let mkIndicators = [];
        if (mk.cpmk) {
          mk.cpmk.forEach(c => mkIndicators.push(...c.indikator));
        }

        // Cari seberapa banyak indikator matkul ini disinggung di logbook
        let matchCount = mkIndicators.reduce((sum, ind) => sum + allMatched.filter(m => m.indikator === ind).length, 0);

        // Base Score (50 - 100)
        let baseScore = 50 + (Math.min(matchCount, 5) / 5) * 50;

        // Final Score = (Base Score x 70%) + (DPL x 18%) + (Mentor x 12%)
        let finalScore = Math.round((baseScore * 0.70) + weightedDpl + weightedMentor);

        let huruf = 'E';
        if (finalScore >= 85) huruf = 'A';
        else if (finalScore >= 80) huruf = 'A-';
        else if (finalScore >= 75) huruf = 'B+';
        else if (finalScore >= 70) huruf = 'B';
        else if (finalScore >= 65) huruf = 'B-';
        else if (finalScore >= 60) huruf = 'C+';
        else if (finalScore >= 50) huruf = 'C';

        transkrip_final.push({
          kode_mk: mk.kode,
          nama_mk: mk.nama,
          sks: mk.sks,
          nilai_angka: finalScore,
          nilai_huruf: huruf
        });
      });
    }
    
    const updated = await PengajuanMagang.findByIdAndUpdate(
      id,
      { 
        penilaian_dpl: {
          sistematika_laporan,
          kualitas_isi,
          penguasaan_materi,
          catatan
        },
        transkrip_final: transkrip_final
      },
      { new: true }
    );
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
