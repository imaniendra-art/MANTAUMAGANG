import React from 'react';
import dbConnect from '@/lib/db';
import Logbook from '@/models/Logbook';
import User from '@/models/User';
import { redirect } from 'next/navigation';

export default async function MagicValidasiPage({ params, searchParams }) {
  const { id } = await params;
  const { action } = await searchParams;
  
  await dbConnect();
  
  let logbook;
  try {
    logbook = await Logbook.findById(id).populate('mahasiswa_id').lean();
  } catch(e) {}

  if (!logbook) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-5xl">❌</div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">Tidak Ditemukan</h1>
          <p className="text-slate-500 mb-4">Logbook tidak ditemukan atau link tidak valid.</p>
        </div>
      </div>
    );
  }

  // Jika aksi sukses
  if (action === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in zoom-in-95 duration-500">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-5xl">✅</div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">Validasi Berhasil!</h1>
          <p className="text-slate-500 mb-6">Aktivitas logbook mahasiswa berhasil divalidasi.</p>
          <p className="text-sm text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-100">
            Terima kasih Bapak/Ibu Mentor atas waktunya. Anda sudah bisa menutup halaman ini.
          </p>
        </div>
      </div>
    );
  }

  async function handleValidasi() {
    'use server';
    await dbConnect();
    const log = await Logbook.findById(id);
    if (log && log.status_validasi === 'menunggu_mentor') {
      log.status_validasi = 'divalidasi_mentor';
      await log.save();
    }
    redirect(`/magic-validasi/${id}?action=success`);
  }

  const tanggal = new Date(logbook.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isAlreadyValidated = logbook.status_validasi === 'divalidasi_mentor' || logbook.status_validasi === 'divalidasi_dpl';
  const isInvalidStatus = logbook.status_validasi !== 'menunggu_mentor' && !isAlreadyValidated;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-800">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100">
          <h1 className="text-2xl font-black mb-1">Aktivitas Logbook Mahasiswa</h1>
          {logbook.status_validasi === 'menunggu_mentor' ? (
             <p className="text-slate-500 text-sm">Mohon periksa aktivitas berikut sebelum melakukan validasi.</p>
          ) : isAlreadyValidated ? (
             <p className="text-emerald-600 text-sm font-bold flex items-center gap-1.5"><span>✅</span> Aktivitas ini sudah tervalidasi.</p>
          ) : (
             <p className="text-red-500 text-sm font-bold flex items-center gap-1.5"><span>❌</span> Aktivitas ini tidak sedang menunggu validasi.</p>
          )}
        </div>
        
        <div className="p-6 md:p-8 space-y-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Mahasiswa</p>
              <p className="font-bold text-indigo-700">{logbook.mahasiswa_id?.nama_lengkap || 'Unknown'}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Kegiatan</p>
              <p className="font-bold">{tanggal}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Deskripsi Kegiatan</p>
            <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {logbook.deskripsi_kegiatan}
            </div>
          </div>

          {logbook.dokumentasi && logbook.dokumentasi.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Dokumentasi & Bukti</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {logbook.dokumentasi.map((doc, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="aspect-video bg-slate-100 flex items-center justify-center p-2 relative">
                      {doc.file.includes('.pdf') ? (
                        <div className="text-4xl">📄</div>
                      ) : (
                        <a href={doc.file} target="_blank" rel="noreferrer" className="block w-full h-full">
                           <img src={doc.file} alt="Bukti" className="object-contain w-full h-full hover:scale-105 transition-transform" />
                        </a>
                      )}
                    </div>
                    {doc.keterangan && (
                      <div className="p-3 bg-white border-t border-slate-100 text-xs font-medium text-slate-600 text-center">
                        {doc.keterangan}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!logbook.dokumentasi?.length && logbook.bukti_kegiatan && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Bukti File</p>
              <a href={logbook.bukti_kegiatan} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline">
                Lihat Bukti
              </a>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 border-t border-slate-100 flex justify-end gap-3 bg-white">
          {logbook.status_validasi === 'menunggu_mentor' ? (
            <form action={handleValidasi}>
              <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-105">
                ✅ Setujui & Validasi
              </button>
            </form>
          ) : isAlreadyValidated ? (
             <div className="px-6 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center gap-2">
                ✅ Sudah Divalidasi
             </div>
          ) : (
             <div className="px-6 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center gap-2">
                ❌ Tidak Dapat Divalidasi
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
