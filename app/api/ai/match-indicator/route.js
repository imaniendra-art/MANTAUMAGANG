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
                cpmk_id: cpmk._id.toString(),
                nama_cpmk: cpmk.nama_cpmk,
                indikator: ind
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
    const prompt = `Anda adalah evaluator akademik magang yang SANGAT KETAT, KRITIS, dan SKEPTIS.
Tugas Anda adalah memverifikasi apakah deskripsi kegiatan harian mahasiswa BENAR-BENAR BUKTI NYATA pemenuhan indikator Capaian Pembelajaran (CPMK).

ATURAN KETAT:
1. JANGAN BERASUMSI. Jika mahasiswa hanya mengatakan "memperhatikan", "berkenalan", atau "berkeliling", itu SANGAT JAUH dan TIDAK SAMA dengan "menganalisis", "mencatat kelemahan", atau "mengevaluasi".
2. Indikator HANYA boleh dianggap tercapai jika tindakan dalam deskripsi secara EKSPLISIT, DETAIL, dan SUBSTANSIAL menunjukkan pencapaian tersebut.
3. Lebih baik mengembalikan array kosong [] daripada meloloskan kegiatan sepele untuk indikator yang berbobot berat.
4. Jangan tertipu oleh kemiripan kata. Fokus pada esensi 'Action' (Tindakan) dan 'Result' (Hasil) dari deskripsi mahasiswa.

DAFTAR INDIKATOR:
${allIndicators.map((ind, i) => `[ID: ${i}] CPMK: ${ind.nama_cpmk} | Indikator: ${ind.indikator}`).join('\n')}

DESKRIPSI KEGIATAN MAHASISWA:
"${deskripsi_kegiatan}"

Keluarkan hasil analisis Anda HANYA dalam format JSON valid berupa array angka ID indikator yang cocok. 
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
