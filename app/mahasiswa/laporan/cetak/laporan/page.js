"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CetakLaporan() {
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

  if (!data) return <div className="p-10 text-center">Memuat dokumen cetak...</div>;

  const { laporan, pengajuan } = data;
  const mhs = session.user;
  const mitra = pengajuan.mitra_id?.nama_perusahaan || pengajuan.detail_tempat?.nama;

  return (
    <div className="bg-slate-200 min-h-screen font-serif text-black">
      {/* Tombol Print (Sembunyi saat diprint) */}
      <div className="fixed top-5 right-5 print:hidden">
        <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700">
          🖨️ Cetak PDF
        </button>
      </div>

      {/* Kontainer Kertas A4 */}
      <div className="max-w-[21cm] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none">
        
        {/* HALAMAN COVER */}
        <div className="p-[3cm] min-h-[29.7cm] flex flex-col items-center justify-between text-center print:p-0 print:h-screen">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold uppercase tracking-widest leading-relaxed">
              LAPORAN AKHIR KEGIATAN MAGANG<br />
              DI PERUSAHAAN {mitra}
            </h1>
          </div>

          <div className="my-16">
            <img src="/mm.png" alt="Logo" className="h-40 mx-auto" />
          </div>

          <div className="space-y-2">
            <p className="text-lg">Disusun oleh:</p>
            <p className="text-xl font-bold uppercase">{mhs.nama_lengkap}</p>
            <p className="text-lg">{mhs.nim_nidn}</p>
          </div>

          <div className="mt-16 space-y-2 font-bold uppercase text-lg">
            <p>PROGRAM STUDI MANAJEMEN</p>
            <p>STIMI YAPMI MAKASSAR</p>
            <p>{new Date(pengajuan.tanggal_selesai).getFullYear()}</p>
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="page-break" style={{ pageBreakBefore: 'always' }}></div>

        {/* KONTEN BAB */}
        <div className="p-[3cm] min-h-[29.7cm] text-justify leading-relaxed space-y-8 print:p-[2cm]">
          
          <section>
            <h2 className="text-center font-bold text-xl mb-6">BAB I<br/>PENDAHULUAN</h2>
            <div className="whitespace-pre-wrap">{laporan.bab1_pendahuluan}</div>
          </section>

          <section className="pt-8">
            <h2 className="text-center font-bold text-xl mb-6">BAB II<br/>PROFIL PERUSAHAAN</h2>
            <div className="whitespace-pre-wrap">{laporan.bab2_profil}</div>
          </section>

          <section className="pt-8">
            <h2 className="text-center font-bold text-xl mb-6">BAB III<br/>AKTIVITAS MAGANG</h2>
            <div className="whitespace-pre-wrap">{laporan.bab3_aktivitas}</div>
          </section>

          <section className="pt-8">
            <h2 className="text-center font-bold text-xl mb-6">BAB IV<br/>PERMASALAHAN & PEMBAHASAN</h2>
            <div className="whitespace-pre-wrap">{laporan.bab4_permasalahan}</div>
          </section>

          <section className="pt-8">
            <h2 className="text-center font-bold text-xl mb-6">BAB V<br/>KESIMPULAN & REKOMENDASI</h2>
            <div className="whitespace-pre-wrap">{laporan.bab5_kesimpulan}</div>
          </section>

          <section className="pt-8">
            <h2 className="text-center font-bold text-xl mb-6">BAB VI<br/>REFLEKSI DIRI</h2>
            <div className="whitespace-pre-wrap">{laporan.bab6_refleksi}</div>
          </section>

        </div>

        {/* LAMPIRAN SURAT */}
        {(laporan.file_pengantar || laporan.file_penerimaan || laporan.file_keterangan) && (
          <div className="page-break" style={{ pageBreakBefore: 'always' }}></div>
        )}

        <div className="p-[3cm] print:p-0">
          {laporan.file_pengantar && (
            <div className="mb-8" style={{ pageBreakInside: 'avoid' }}>
              <h3 className="font-bold mb-4">Lampiran: Surat Pengantar Magang</h3>
              {laporan.file_pengantar.startsWith('data:image') ? (
                <img src={laporan.file_pengantar} className="w-full border border-slate-200" />
              ) : (
                <p><i>(Dokumen berformat PDF dilampirkan terpisah)</i></p>
              )}
            </div>
          )}
          {laporan.file_penerimaan && (
            <div className="mb-8" style={{ pageBreakInside: 'avoid' }}>
              <h3 className="font-bold mb-4">Lampiran: Surat Penerimaan Magang</h3>
              {laporan.file_penerimaan.startsWith('data:image') ? (
                <img src={laporan.file_penerimaan} className="w-full border border-slate-200" />
              ) : (
                <p><i>(Dokumen berformat PDF dilampirkan terpisah)</i></p>
              )}
            </div>
          )}
          {laporan.file_keterangan && (
            <div className="mb-8" style={{ pageBreakInside: 'avoid' }}>
              <h3 className="font-bold mb-4">Lampiran: Surat Keterangan Selesai Magang</h3>
              {laporan.file_keterangan.startsWith('data:image') ? (
                <img src={laporan.file_keterangan} className="w-full border border-slate-200" />
              ) : (
                <p><i>(Dokumen berformat PDF dilampirkan terpisah)</i></p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
