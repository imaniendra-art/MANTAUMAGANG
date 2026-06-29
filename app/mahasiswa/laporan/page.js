"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";

export default function MahasiswaLaporan() {
  const { data: session } = useSession();
  const [pengajuan, setPengajuan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/pengajuan?mhsId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setPengajuan(data);
          setLoading(false);
        });
    }
  }, [session]);

  const getGrade = (score) => {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'E';
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DashboardLayout title="Laporan & Sertifikat">
        <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Memuat data kelulusan...</div>
      </DashboardLayout>
    );
  }

  const isEvaluated = pengajuan && pengajuan.nilai_akhir_mutlak !== undefined && pengajuan.nilai_akhir_mutlak !== null;

  return (
    <DashboardLayout title="Laporan Akhir & Sertifikat Magang">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Sembunyikan elemen non-cetak */
          aside, header, nav, .no-print, button {
            display: none !important;
          }
          
          /* Reset container utama agar tidak terpotong h-screen / overflow */
          body, html, #__next, div.min-h-screen, div.flex-1 {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            position: static !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          /* Rapikan area print */
          #print-area {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          @page {
            size: A4;
            margin: 2cm;
          }
        }
      `}} />

      {!isEvaluated ? (
        <div className="max-w-2xl mx-auto mt-10 animate-in zoom-in-95 duration-500">
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="w-24 h-24 bg-slate-100 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">⏳</div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Evaluasi Belum Selesai</h2>
            <p className="text-slate-600 leading-relaxed">
              Laporan Akhir dan Sertifikat Anda sedang dalam tahap penyusunan dan pleno oleh DPL dan Mentor Instansi. Halaman ini akan terbuka secara otomatis setelah Nilai Akhir diterbitkan.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          <div className="flex gap-4 mb-8 no-print">
            <button onClick={handlePrint} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-slate-800 dark:text-slate-100 font-bold rounded-xl shadow-[0_4px_15px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2">
              📄 Generate Transkrip Resmi (PDF)
            </button>
            <button onClick={handlePrint} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2">
              🎓 Generate Sertifikat (PDF)
            </button>
          </div>

          <div id="print-area" className="bg-white p-10 md:p-16 rounded-3xl border border-slate-200 shadow-md max-w-4xl mx-auto font-serif text-slate-900 relative">
            
            {/* Latar Belakang Transparan Sertifikat (Opsional) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <div className="text-[250px] font-black tracking-tighter">STIMI</div>
            </div>

            {/* Kop Surat STIMI */}
            <div className="border-b-4 border-slate-900 pb-6 mb-8 flex items-center gap-6 relative z-10">
              <div className="w-24 h-24 bg-indigo-900 rounded-full flex items-center justify-center text-slate-800 dark:text-slate-100 font-sans font-black text-xs text-center shrink-0">
                LOGO<br/>STIMI
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-2xl font-black tracking-widest uppercase">Sekolah Tinggi Ilmu Manajemen Indonesia</h1>
                <h2 className="text-xl font-bold uppercase mt-1">(STIMI) YAPMI MAKASSAR</h2>
                <p className="text-sm mt-2 font-medium">Jl. Perintis Kemerdekaan, Tamalanrea, Makassar, Sulawesi Selatan</p>
                <p className="text-sm font-medium">Website: www.stimiyapmim.ac.id | Email: info@stimiyapmim.ac.id</p>
              </div>
            </div>

            {/* Judul Dokumen */}
            <div className="text-center mb-10 relative z-10">
              <h3 className="text-xl font-black uppercase underline underline-offset-4">Transkrip Nilai Magang Berdampak (OBE)</h3>
              <p className="text-sm mt-2 font-bold uppercase">Tahun Akademik 2026/2027</p>
            </div>

            {/* Data Diri */}
            <div className="grid grid-cols-[150px_20px_1fr] gap-y-3 text-sm font-medium mb-12 relative z-10">
              <div>Nama Mahasiswa</div><div>:</div><div className="font-bold">{pengajuan.mahasiswa_id?.nama_lengkap}</div>
              <div>NIM / NIDN</div><div>:</div><div className="font-bold">{pengajuan.mahasiswa_id?.nim_nidn}</div>
              <div>Program Studi</div><div>:</div><div className="font-bold">{pengajuan.mahasiswa_id?.program_studi || 'Manajemen'}</div>
              <div>Instansi Magang</div><div>:</div><div className="font-bold">{pengajuan.detail_tempat?.nama}</div>
              <div>Posisi / Peran</div><div>:</div><div className="font-bold">{pengajuan.detail_tempat?.posisi}</div>
            </div>

            {/* Nilai Utama */}
            <div className="bg-slate-50 border-2 border-slate-800 p-8 mb-12 text-center flex flex-col items-center relative z-10">
              <p className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-slate-300 pb-2 w-full">Hasil Evaluasi Akhir Mutlak</p>
              <div className="flex items-end justify-center gap-16">
                <div className="text-center">
                  <div className="text-8xl font-black text-slate-900 leading-none drop-shadow-md">{getGrade(pengajuan.nilai_akhir_mutlak)}</div>
                  <p className="text-xs font-bold uppercase tracking-widest mt-4">Huruf Mutu</p>
                </div>
                <div className="text-center">
                  <div className="text-8xl font-black text-slate-900 leading-none drop-shadow-md">{pengajuan.nilai_akhir_mutlak}</div>
                  <p className="text-xs font-bold uppercase tracking-widest mt-4">Angka Mutu</p>
                </div>
              </div>
            </div>

            {/* Catatan Evaluasi */}
            <div className="mb-16 relative z-10">
              <h4 className="font-bold border-b border-slate-300 pb-2 mb-3">Catatan Evaluasi Pembimbing:</h4>
              <p className="italic text-slate-700 leading-relaxed text-justify">
                &quot;{pengajuan.catatan_evaluasi || 'Mahasiswa telah menyelesaikan program magang berdampak dengan baik dan memenuhi capaian pembelajaran mata kuliah (CPMK) yang disyaratkan sesuai dengan kurikulum yang ditetapkan oleh prodi.'}&quot;
              </p>
            </div>

            {/* Tanda Tangan */}
            <div className="flex justify-between items-end pt-10 mt-10 relative z-10">
              <div className="text-center">
                <p className="mb-24 font-medium">Mengetahui,<br/>Mentor / Pembimbing Instansi</p>
                <div className="w-56 border-b border-slate-800 mx-auto"></div>
                <p className="mt-2 font-bold">(..................................................)</p>
              </div>
              <div className="text-center">
                <p className="mb-24 font-medium">Makassar, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br/>Dosen Pembimbing Lapangan</p>
                <div className="w-56 border-b border-slate-800 mx-auto"></div>
                <p className="mt-2 font-bold">(..................................................)</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
