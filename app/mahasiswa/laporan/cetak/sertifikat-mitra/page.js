"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CetakSertifikatMitra() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/laporan-akhir?mhsId=${session.user.id}`)
        .then(res => res.json())
        .then(d => {
          if (d.laporan && d.pengajuan) {
            setData(d);
          }
        });
    }
  }, [session]);

  if (!data) return <div className="p-10 text-center">Memuat Sertifikat...</div>;

  const { laporan, pengajuan } = data;
  const mitra = pengajuan.mitra_id?.nama_perusahaan || pengajuan.detail_tempat?.nama;

  return (
    <div className="bg-slate-200 min-h-screen font-sans text-slate-800 flex items-center justify-center p-8 print:p-0 print:bg-white">
      
      <div className="fixed top-5 right-5 print:hidden z-50">
        <button onClick={() => window.print()} className="px-6 py-3 bg-slate-800 text-white font-bold rounded-lg shadow-lg hover:bg-slate-900">
          🖨️ Cetak Sertifikat Mitra (Landscape)
        </button>
        <p className="text-xs text-center mt-2 text-slate-500">Pastikan Layout = Landscape di pengaturan print</p>
      </div>

      {/* Kontainer Kertas A4 Landscape: 29.7cm x 21cm */}
      <div className="w-[29.7cm] h-[21cm] bg-white relative overflow-hidden shadow-2xl print:shadow-none flex flex-col justify-center text-center p-[2cm]">
        
        {/* Latar Belakang Elegan */}
        <img src="/bg_serti.png" alt="Background" className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col h-full justify-between items-center">
          
          <div className="w-full flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <img src="/logo_stimi.png" alt="Logo STIMI" className="h-16 object-contain" />
              <img src="/logo_berdampak.png" alt="Logo Berdampak" className="h-16 object-contain" />
              <img src="/mm.png" alt="Logo Mantau Magang" className="h-12 object-contain" />
            </div>
            <div className="text-right flex flex-col justify-center">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-widest leading-none" style={{ fontFamily: 'Georgia, serif' }}>Sertifikat Penghargaan</h2>
              <p className="text-base font-black text-amber-700 uppercase tracking-widest leading-none mt-1">Kemitraan STIMI YAPMI Makassar</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center w-full my-8">
            <p className="text-lg text-slate-600 mb-6">Penghargaan tertinggi diberikan kepada:</p>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-wider mb-8" style={{ fontFamily: 'Georgia, serif' }}>
              {mitra}
            </h1>

            <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
              Atas dukungan, dedikasi, dan kerja samanya sebagai instansi Mitra dalam menyukseskan program 
              <span className="font-bold text-slate-800"> Magang Berdampak</span>. Kontribusi yang diberikan 
              sangat berarti dalam membimbing dan meningkatkan kompetensi mahasiswa kami di dunia industri nyata.
            </p>
          </div>

          <div className="w-full flex justify-center items-end">
            <div className="text-center w-80">
              <p className="text-sm text-slate-600 mb-16">
                Makassar, {new Date(pengajuan.tanggal_selesai).toLocaleDateString('id-ID')}<br/>
                Ketua Sekolah Tinggi Ilmu Manajemen<br/>
                Indonesia YAPMI Makassar,
              </p>
              <div className="border-b border-slate-800 w-full mb-2"></div>
              <p className="font-bold text-slate-800">Dr. Ibrahim Syah, S.E.,M.M</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
