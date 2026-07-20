import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Logbook from '@/models/Logbook';
import PengajuanMagang from '@/models/PengajuanMagang';
import User from '@/models/User'; 
import { uploadToMinio, deleteFromMinio } from '@/lib/minio';
import PaketMatkul from '@/models/PaketMatkul';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

    // Admin: Tarik seluruh logbook untuk monitoring
    if (role === 'admin') {
      const logs = await Logbook.find({})
        .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn program_studi' })
        .populate({ path: 'pengajuan_id', select: 'detail_tempat posisi_id', populate: { path: 'posisi_id mitra_id' } })
        .sort({ tanggal: -1 });
      return NextResponse.json(logs);
    }

    // Mentor: Tarik semua logbook yang menunggu validasi lapangan
    if (role === 'mentor' && userId) {
      const pengajuans = await PengajuanMagang.find({ mentor_id: userId }).select('_id');
      const pengajuanIds = pengajuans.map(p => p._id);

      const logs = await Logbook.find({ 
        status_validasi: 'menunggu_mentor',
        pengajuan_id: { $in: pengajuanIds }
      })
        .populate({ path: 'mahasiswa_id', select: 'nama_lengkap nim_nidn' })
        .populate({ path: 'pengajuan_id', select: 'detail_tempat' })
        .sort({ tanggal: 1 });
      return NextResponse.json(logs);
    }

    // Mentor Histori: Tarik semua logbook yang sudah tidak pending (riwayat)
    if (role === 'mentor_histori' && userId) {
      const pengajuans = await PengajuanMagang.find({ mentor_id: userId }).select('_id');
      const pengajuanIds = pengajuans.map(p => p._id);

      const logs = await Logbook.find({ 
        status_validasi: { $in: ['divalidasi_mentor', 'divalidasi_dpl', 'revisi'] },
        pengajuan_id: { $in: pengajuanIds }
      })
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
    
    // SEMENTARA: Upload ke MinIO di bypass, langsung simpan base64 ke MongoDB
    /*
    if (data.bukti_kegiatan && data.bukti_kegiatan.startsWith('data:')) {
      data.bukti_kegiatan = await uploadToMinio(data.bukti_kegiatan, 'logbook');
    }
    
    if (data.dokumentasi && Array.isArray(data.dokumentasi)) {
      for (let i = 0; i < data.dokumentasi.length; i++) {
        if (data.dokumentasi[i].file && data.dokumentasi[i].file.startsWith('data:')) {
          data.dokumentasi[i].file = await uploadToMinio(data.dokumentasi[i].file, 'logbook');
        }
      }
    }
    */

    const newLog = await Logbook.create(data);

    // Jalankan proses AI di background (tidak di-await)
    processAILogbook(newLog._id, data.pengajuan_id, data.deskripsi_kegiatan).catch(err => console.error("Background AI Error:", err));

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    const data = await req.json();
    const { id, status_validasi, catatan_revisi, deskripsi_kegiatan, bukti_link, bukti_kegiatan, dokumentasi, matched_indicators } = data;
    
    if (!id) {
      return NextResponse.json({ error: "Missing Logbook ID" }, { status: 400 });
    }
    
    let updateData = {};
    if (status_validasi) updateData.status_validasi = status_validasi;
    if (catatan_revisi !== undefined) updateData.catatan_revisi = catatan_revisi;
    if (deskripsi_kegiatan) updateData.deskripsi_kegiatan = deskripsi_kegiatan;
    if (bukti_link !== undefined) updateData.bukti_link = bukti_link;
    if (bukti_kegiatan) {
      // SEMENTARA: Upload ke MinIO di bypass, langsung simpan base64 ke MongoDB
      /*
      if (bukti_kegiatan.startsWith('data:')) {
        const logbook = await Logbook.findById(id);
        if (logbook && logbook.bukti_kegiatan && !logbook.bukti_kegiatan.startsWith('data:')) {
          try { await deleteFromMinio(logbook.bukti_kegiatan); } catch (e) { console.error("Error deleting old file:", e); }
        }
        updateData.bukti_kegiatan = await uploadToMinio(bukti_kegiatan, 'logbook');
      } else {
        updateData.bukti_kegiatan = bukti_kegiatan;
      }
      */
      updateData.bukti_kegiatan = bukti_kegiatan;
    }

    if (dokumentasi && Array.isArray(dokumentasi)) {
      // SEMENTARA: Upload ke MinIO di bypass, langsung simpan base64 ke MongoDB
      /*
      for (let i = 0; i < dokumentasi.length; i++) {
        if (dokumentasi[i].file && dokumentasi[i].file.startsWith('data:')) {
          dokumentasi[i].file = await uploadToMinio(dokumentasi[i].file, 'logbook');
        }
      }
      */
      updateData.dokumentasi = dokumentasi;
    }
    if (matched_indicators) updateData.matched_indicators = matched_indicators;

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

// Background Task untuk AI Matching
async function processAILogbook(logbookId, pengajuanId, deskripsi_kegiatan) {
  try {
    if (!process.env.GEMINI_API_KEY) return;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const pengajuan = await PengajuanMagang.findById(pengajuanId);
    if (!pengajuan || !pengajuan.paket_matkul_id) return;

    const paket = await PaketMatkul.findById(pengajuan.paket_matkul_id);
    if (!paket) return;

    // Extract all possible indicators
    const allIndicators = [];
    paket.mata_kuliah.forEach(mk => {
      if (mk.cpmk && mk.cpmk.length > 0) {
        mk.cpmk.forEach(cpmk => {
          if (cpmk.indikator && cpmk.indikator.length > 0) {
            cpmk.indikator.forEach(ind => {
              allIndicators.push({
                matkul_kode: mk.kode,
                matkul_nama: mk.nama,
                cpmk_id: cpmk._id.toString(),
                nama_cpmk: cpmk.nama_cpmk,
                indikator: ind,
                saran_kegiatan: cpmk.saran_kegiatan || ""
              });
            });
          }
        });
      }
    });

    if (allIndicators.length === 0) return;

    // Build Prompt for Gemini
    const prompt = `Anda adalah Asisten Penilai Magang yang BIJAKSANA namun OBJEKTIF.
Tugas Anda adalah mencocokkan deskripsi kegiatan harian mahasiswa dengan indikator Capaian Pembelajaran (CPMK). Tugas utama Anda adalah mencari "Semantic Matching" (Kesamaan Makna) antara apa yang dikerjakan mahasiswa dengan apa yang ditargetkan indikator.

PANDUAN PENILAIAN KETAT:
1. MAKSIMAL 3 INDIKATOR: Pilih HANYA MAKSIMAL 3 indikator yang PALING RELEVAN dengan kegiatan hari tersebut. Jangan serakah, pilih yang paling kuat keterkaitannya.
2. BERIKAN ALASAN SPESIFIK: Untuk setiap indikator yang dipilih, Anda WAJIB memberikan "alasan" mengapa kegiatan tersebut memenuhi indikator itu. Alasan harus secara eksplisit mengutip bagian dari kegiatan mahasiswa yang relevan.
Contoh: "Berdasarkan kegiatan 'mengetik laporan keuangan', mahasiswa telah mempraktikkan keterampilan teknis administrasi."
3. Jika kegiatan sangat tidak berhubungan (misal: "saya tidur seharian"), jangan pilih indikator apapun.

DAFTAR INDIKATOR:
${allIndicators.map((ind, i) => `[ID: ${i}] CPMK: ${ind.nama_cpmk} | Indikator Utama: ${ind.indikator} ${ind.saran_kegiatan ? `| Saran Kegiatan (Bahasa Lapangan): ${ind.saran_kegiatan}` : ''}`).join('\n')}

DESKRIPSI KEGIATAN MAHASISWA (Bahasa Lapangan):
"${deskripsi_kegiatan}"

Keluarkan hasil analisis Anda HANYA dalam format JSON array yang valid. Setiap elemen array adalah sebuah object dengan key "id" (angka ID indikator) dan "alasan" (penjelasan singkat maksimal 2 kalimat).
Contoh output jika cocok:
[
  { "id": 1, "alasan": "Berdasarkan kegiatan 'memperkenalkan diri', mahasiswa menunjukkan kemampuan komunikasi awal." },
  { "id": 3, "alasan": "Tindakan 'membantu mengerjakan laporan' menunjukkan partisipasi dalam tugas teknis." }
]
Contoh output jika tidak ada yang cocok: []
Jangan tambahkan teks apapun selain array JSON tersebut.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResult = response.text();
    
    let matchedData = [];
    try {
      matchedData = JSON.parse(textResult);
    } catch (e) {
      console.error("Gagal parse output AI:", textResult);
    }

    const matchedIndicators = [];
    if (Array.isArray(matchedData)) {
      matchedData.forEach(item => {
        if (item && typeof item.id === 'number' && allIndicators[item.id]) {
          matchedIndicators.push({
            ...allIndicators[item.id],
            alasan: item.alasan || "Relevan dengan kegiatan mahasiswa."
          });
        }
      });
    }

    // Update logbook with matched indicators
    if (matchedIndicators.length > 0) {
      await Logbook.findByIdAndUpdate(logbookId, { matched_indicators: matchedIndicators.slice(0, 3) });
    }
  } catch (error) {
    console.error("Background AI process error:", error);
  }
}
