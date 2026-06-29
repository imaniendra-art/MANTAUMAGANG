"use client";

import Link from 'next/link';
import Image from 'next/image';

export default function AlurMagang() {
  return (
    <main className="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen">
      {/* NAVBAR - SAMA SEPERTI LANDING PAGE */}
      <nav className="w-full px-8 lg:px-[5cm] py-6 flex justify-between items-center bg-[#0F172A] relative z-20 shadow-lg">
        <Link href="/" className="flex items-center gap-3 lg:gap-4">
          <Image src="/mm_white.png" alt="Mantau Magang Logo" width={180} height={60} className="h-10 lg:h-12 w-auto object-contain drop-shadow-md" priority />
          <div className="text-lg lg:text-xl font-extrabold tracking-widest text-slate-100 border-l border-slate-500/50 pl-3 lg:pl-4 h-8 lg:h-10 flex items-center">
            STIMI YAPMI
          </div>
        </Link>
        <Link 
          href="/"
          className="px-6 py-2 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all shadow-lg shadow-white/10"
        >
          Kembali ke Beranda
        </Link>
      </nav>

      {/* HEADER SECTION */}
      <div className="bg-[#0F172A] relative pt-16 pb-32 overflow-hidden text-center">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40" style={{ backgroundImage: "url('/mantau_hero.png')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/50 to-[#0F172A]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-500/20 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="relative z-10 px-8 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex px-4 py-1.5 rounded-full border border-blue-400/30 bg-blue-900/40 text-blue-300 text-sm font-bold tracking-widest backdrop-blur-sm uppercase">
            Panduan Lengkap
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
            Alur Pelaksanaan <span className="text-blue-400">Magang Berdampak</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
            Pahami langkah-langkah mudah dari awal pengajuan hingga tahap penilaian dan konversi SKS berbasis Outcome-Based Education (OBE).
          </p>
        </div>
      </div>

      {/* TIMELINE SECTION */}
      <div className="max-w-5xl mx-auto px-8 -mt-16 relative z-20 pb-24">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-16 border border-slate-100">
          
          <div className="relative border-l-4 border-blue-100 ml-6 md:ml-10 space-y-16">
            
            {/* TAHAP 1 */}
            <div className="relative pl-8 md:pl-12">
              <div className="absolute -left-[22px] top-0 w-10 h-10 bg-white border-4 border-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-blue-600 font-black text-lg">1</span>
              </div>
              <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Eksplorasi & Pengajuan</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Mahasiswa mencari posisi magang yang tersedia di halaman utama. Pilihlah posisi dan instansi yang paling sesuai dengan minat dan target capaian program studi Anda. 
                </p>
                <ul className="space-y-2 text-sm font-medium text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> Login menggunakan NIM</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> Lengkapi profil dan berkas persyaratan</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> Ajukan posisi magang yang diinginkan</li>
                </ul>
              </div>
            </div>

            {/* TAHAP 2 */}
            <div className="relative pl-8 md:pl-12">
              <div className="absolute -left-[22px] top-0 w-10 h-10 bg-white border-4 border-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <span className="text-emerald-600 font-black text-lg">2</span>
              </div>
              <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-4">⚖️</div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Validasi & Penugasan</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Program Studi akan meninjau pengajuan Anda. Jika disetujui, Prodi akan mengalokasikan Dosen Pembimbing Lapangan (DPL) serta Mentor dari pihak industri.
                </p>
                <ul className="space-y-2 text-sm font-medium text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Review berkas oleh Admin Prodi</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Penetapan DPL & Mentor</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Fitur Logbook Harian otomatis terbuka</li>
                </ul>
              </div>
            </div>

            {/* TAHAP 3 */}
            <div className="relative pl-8 md:pl-12">
              <div className="absolute -left-[22px] top-0 w-10 h-10 bg-white border-4 border-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-amber-600 font-black text-lg">3</span>
              </div>
              <div className="bg-amber-50/50 p-8 rounded-3xl border border-amber-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Pelaksanaan & Pengisian Logbook</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Selama masa magang, mahasiswa diwajibkan melakukan absen harian (check-in) dan mengisi logbook kegiatan. AI cerdas kami akan menganalisis kegiatan Anda untuk mencocokkan dengan target CPMK.
                </p>
                <ul className="space-y-2 text-sm font-medium text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Check-in absen setiap hari kerja</li>
                  <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Isi Logbook dengan deskripsi (Metode STAR) & Foto Bukti</li>
                  <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Validasi kegiatan secara berkala oleh Mentor & DPL</li>
                </ul>
              </div>
            </div>

            {/* TAHAP 4 */}
            <div className="relative pl-8 md:pl-12">
              <div className="absolute -left-[22px] top-0 w-10 h-10 bg-white border-4 border-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-indigo-600 font-black text-lg">4</span>
              </div>
              <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Evaluasi Dampak & Konversi SKS</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Di akhir periode magang, DPL akan merekapitulasi seluruh capaian target CPMK yang telah tervalidasi. Pencapaian ini kemudian dikonversi menjadi nilai matakuliah sesuai pedoman akademik (OBE).
                </p>
                <ul className="space-y-2 text-sm font-medium text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Penilaian akhir oleh Mentor Industri</li>
                  <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Rekapitulasi target CPMK oleh DPL</li>
                  <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Output nilai akhir & konversi SKS</li>
                </ul>
              </div>
            </div>

          </div>

          <div className="mt-16 text-center">
            <h4 className="text-xl font-bold text-slate-800 mb-6">Siap untuk memulai pengalaman baru?</h4>
            <Link 
              href="/login" 
              className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-1"
            >
              Mulai Pendaftaran Sekarang
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
