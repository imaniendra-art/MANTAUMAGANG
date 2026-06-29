"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function PengajuanMagangPage() {
  const { data: session } = useSession();
  
  const [posisiList, setPosisiList] = useState([]);
  const [userPengajuan, setUserPengajuan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKonsentrasi, setFilterKonsentrasi] = useState("Semua");

  const userKonsentrasi = session?.user?.konsentrasi || "SDM";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [posisiRes, pengajuanRes] = await Promise.all([
          fetch('/api/posisi'),
          fetch(`/api/pengajuan?mhsId=${session?.user?.id}`)
        ]);
        
        const posData = await posisiRes.json();
        const pengajuanData = await pengajuanRes.json();
        
        if (Array.isArray(posData)) {
          setPosisiList(posData);
        }
        
        if (pengajuanData && !pengajuanData.error) {
          setUserPengajuan(pengajuanData);
        }
      } catch (error) {
        console.error("Gagal mengambil data", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const filteredPosisi = posisiList.filter(pos => {
    const matchSearch = pos.nama_posisi?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        pos.mitra_id?.nama_instansi?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKonsentrasi = filterKonsentrasi === "Semua" || pos.konsentrasi === filterKonsentrasi;
    return matchSearch && matchKonsentrasi;
  });

  const isLocked = userPengajuan && ['menunggu', 'disetujui'].includes(userPengajuan.status_pengajuan);

  if (loading) {
    return (
      <DashboardLayout title="Bursa Magang">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 rounded-full animate-spin border-blue-500/30 border-t-blue-500" />
            <div className="text-slate-500 font-bold animate-pulse">Memuat Bursa Magang...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Bursa Magang">
      <div className="w-full space-y-8">
        
        {/* Notifikasi / Alert Banner */}
        {userPengajuan && userPengajuan.status_pengajuan === 'menunggu' && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="text-2xl shrink-0 mt-0.5">⏳</div>
            <div>
              <h3 className="font-bold text-amber-800 dark:text-amber-400">Pengajuan Sedang Diproses</h3>
              <p className="text-sm text-amber-700 dark:text-amber-500 mt-1 leading-relaxed">
                ⏳ Pengajuan Anda sedang diverifikasi oleh Admin. Harap bersabar.
              </p>
            </div>
          </div>
        )}

        {userPengajuan && userPengajuan.status_pengajuan === 'disetujui' && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="text-2xl shrink-0 mt-0.5">🎉</div>
            <div>
              <h3 className="font-bold text-emerald-800 dark:text-emerald-400">Pengajuan Disetujui</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-500 mt-1 leading-relaxed">
                🎉 Selamat! Anda diterima. DPL Anda: <span className="font-bold">{userPengajuan.dpl_id?.nama_lengkap || 'Belum ditugaskan'}</span>
              </p>
            </div>
          </div>
        )}

        {userPengajuan && userPengajuan.status_pengajuan === 'ditolak' && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="text-2xl shrink-0 mt-0.5">❌</div>
            <div>
              <h3 className="font-bold text-rose-800 dark:text-rose-400">Pengajuan Magang Ditolak</h3>
              <p className="text-sm text-rose-700 dark:text-rose-500 mt-1 leading-relaxed">
                ❌ Pengajuan Magang Ditolak! Alasan: <span className="font-bold">{userPengajuan.alasan_penolakan || 'Tidak ada alasan spesifik.'}</span>. Silakan ajukan posisi magang yang lain.
              </p>
            </div>
          </div>
        )}

        {/* Header & Filter Section */}
        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="w-full md:w-auto">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Bursa Posisi Magang</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Temukan posisi yang sesuai dengan <span className="font-bold text-blue-600 dark:text-blue-400">{userKonsentrasi}</span> Anda.
            </p>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 shrink-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                🔍
              </div>
              <input
                type="text"
                placeholder="Cari posisi atau instansi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-900 font-medium text-sm text-slate-900 dark:text-white transition-all"
                disabled={isLocked}
              />
            </div>
            <div className="relative">
              <select
                value={filterKonsentrasi}
                onChange={(e) => setFilterKonsentrasi(e.target.value)}
                className="w-full sm:w-48 px-4 py-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-900 font-medium text-sm text-slate-900 dark:text-white transition-all cursor-pointer appearance-none"
                disabled={isLocked}
              >
                <option value="Semua">Semua Konsentrasi</option>
                <option value="SDM">SDM</option>
                <option value="Keuangan">Keuangan</option>
                <option value="Pemasaran">Pemasaran</option>
                <option value="Pengembangan Bisnis">Pengembangan Bisnis</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Catalog */}
        {filteredPosisi.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 shadow-sm p-12 rounded-[2rem] border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Tidak Ada Posisi Ditemukan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Coba ubah kata kunci pencarian atau filter konsentrasi Anda.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${isLocked ? 'opacity-80 grayscale-[30%]' : ''}`}>
            {filteredPosisi.map(pos => {
              const isMatch = pos.konsentrasi === userKonsentrasi;
              const isFull = pos.kuota <= 0;

              return (
                <div key={pos._id} className={`group relative p-6 lg:p-8 rounded-[2rem] border transition-all duration-500 flex flex-col h-full hover:-translate-y-1 backdrop-blur-xl shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)] bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700/40 ${isMatch ? 'border-amber-300 dark:border-amber-500/50' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400/40 dark:hover:border-blue-500/30'}`}>
                  
                  {/* Grid Pattern Overlay (muncul saat hover) */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none rounded-[2rem] transition-opacity duration-500 overflow-hidden">
                     <svg className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                       <defs>
                         <pattern id={`cardGrid-${pos._id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                           <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/[0.03]" strokeWidth="1" />
                         </pattern>
                       </defs>
                       <rect width="100%" height="100%" fill={`url(#cardGrid-${pos._id})`} />
                     </svg>
                  </div>

                  {/* Badge Highlight */}
                  {isMatch && (
                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/30 border border-white dark:border-slate-800 z-10 flex items-center gap-1">
                      <span>⭐</span> Rekomendasi
                    </div>
                  )}

                  <div className="flex-1 relative z-10">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      {pos.mitra_id?.nama_instansi || "Nama Instansi Tidak Diketahui"}
                    </p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {pos.nama_posisi}
                    </h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs shrink-0 shadow-sm border border-slate-200 dark:border-slate-600">🎯</span>
                        <span className="truncate">{pos.konsentrasi}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs shrink-0 shadow-sm border border-slate-200 dark:border-slate-600">👥</span>
                        <span className={`font-bold ${isFull ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isFull ? 'Kuota Penuh' : `Sisa Kuota: ${pos.kuota} Orang`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-auto relative z-10">
                    {isLocked ? (
                      <div className="block w-full py-3 px-4 text-center text-sm font-bold rounded-xl border bg-slate-100 text-slate-400 border-transparent dark:bg-slate-800 dark:text-slate-500 pointer-events-none">
                        🔒 Pendaftaran Terkunci
                      </div>
                    ) : (
                      <Link
                        href={`/mahasiswa/pengajuan/detail?mitra_id=${pos.mitra_id?._id}&posisi_id=${pos._id}`}
                        className={`block w-full py-3 px-4 text-center text-sm font-bold rounded-xl transition-all duration-300 border ${
                          isFull 
                            ? 'bg-slate-100 text-slate-400 border-transparent dark:bg-slate-800 dark:text-slate-500 pointer-events-none' 
                            : 'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        {isFull ? 'Pendaftaran Ditutup' : 'Lihat Detail & Daftar'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
