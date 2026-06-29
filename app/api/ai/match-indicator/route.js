import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/db';
import PengajuanMagang from '@/models/PengajuanMagang';
import PaketMatkul from '@/models/PaketMatkul';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { pengajuan_id, deskripsi_kegiatan } = await req.json();

    if (!pengajuan_id || !deskripsi_kegiatan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // Ambil pengajuan untuk mengetahui paket matkul
    const pengajuan = await PengajuanMagang.findById(pengajuan_id);
    if (!pengajuan) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
    }

    // Ambil paket matkul
    const paket = await PaketMatkul.findById(pengajuan.paket_matkul_id);
    if (!paket) {
      return NextResponse.json({ error: "Paket matkul tidak ditemukan" }, { status: 404 });
    }

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

    if (allIndicators.length === 0) {
      return NextResponse.json({ matched: [] });
    }

    // Build Prompt for Gemini
    const prompt = `Anda adalah Asisten Penilai Magang yang BIJAKSANA dan PENGERTIAN.
Tugas Anda adalah mencocokkan deskripsi kegiatan harian mahasiswa dengan indikator Capaian Pembelajaran (CPMK). Seringkali bahasa lapangan berbeda dengan bahasa akademik/dosen. Tugas utama Anda adalah mencari "Semantic Matching" (Kesamaan Makna) antara apa yang dikerjakan mahasiswa dengan apa yang ditargetkan indikator.

PANDUAN PENILAIAN FLEKSIBEL:
1. CARI BENANG MERAH MAKNA: Jika mahasiswa "ngobrol", "meeting", "berkenalan", "duduk di ruang rapat", ini bisa dihubungkan ke indikator yang berkaitan dengan "komunikasi", "koordinasi", atau "observasi budaya/struktur organisasi". 
2. BERIKAN REWARD: Jangan kaku! Mahasiswa sedang belajar. Kegiatan sederhana seperti "keliling kantor" atau "orientasi divisi" sangat berharga dan bisa dimasukkan ke dalam kategori "observasi alur kerja" atau "identifikasi masalah".
3. JIKA ADA SARAN KEGIATAN: Indikator mungkin dilengkapi dengan [Saran Kegiatan]. Jadikan saran ini sebagai pedoman. Jika kegiatan mahasiswa mirip dengan saran tersebut, langsung loloskan!
4. EVALUASI POSITIF: Usahakan sebisa mungkin untuk mencarikan minimal 1 indikator yang paling relevan untuk menghargai usaha mahasiswa, kecuali kegiatannya benar-benar sangat tidak berhubungan (misal: "saya tidur seharian").

DAFTAR INDIKATOR:
${allIndicators.map((ind, i) => `[ID: ${i}] CPMK: ${ind.nama_cpmk} | Indikator Utama: ${ind.indikator} ${ind.saran_kegiatan ? `| Saran Kegiatan (Bahasa Lapangan): ${ind.saran_kegiatan}` : ''}`).join('\n')}

DESKRIPSI KEGIATAN MAHASISWA (Bahasa Lapangan):
"${deskripsi_kegiatan}"

Keluarkan hasil analisis Anda HANYA dalam format JSON valid berupa array angka ID indikator yang cocok secara semantik. 
Contoh output jika cocok dengan ID 1 dan 3: [1, 3]
Contoh output jika tidak ada yang cocok: []
Jangan tambahkan teks apapun selain array JSON tersebut.`;

    // Initialize model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResult = response.text();
    
    let matchedIndexes = [];
    try {
      matchedIndexes = JSON.parse(textResult);
    } catch (e) {
      console.error("Gagal parse output AI:", textResult);
    }

    const matchedIndicators = [];
    if (Array.isArray(matchedIndexes)) {
      matchedIndexes.forEach(i => {
        if (allIndicators[i]) {
          matchedIndicators.push(allIndicators[i]);
        }
      });
    }

    return NextResponse.json({ matched: matchedIndicators });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
