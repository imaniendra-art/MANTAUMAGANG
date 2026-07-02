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
          fetch('/api/posisi?public=true'),
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

        {userPengajuan && userPengajuan.status_pengajuan === 'disetujui' ? (
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center border border-emerald-500/30">
            {/* Dekorasi Background */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-900/20 rounded-full blur-3xl pointer-events-none"></div>
            <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gridPattern" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridPattern)" />
            </svg>

            <div className="flex-1 relative z-10 w-full">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase mb-6 shadow-sm border border-white/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                </span>
                Magang Sedang Berlangsung
              </div>
              
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
                Selamat Menjalankan Magang di <br className="hidden md:block"/>
                <span className="text-emerald-100 drop-shadow-sm">{userPengajuan.posisi_id?.mitra_id?.nama_instansi || userPengajuan.mitra_id?.nama_instansi || userPengajuan.detail_tempat?.nama || 'Perusahaan Mitra'}</span>!
              </h2>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 w-full mb-8 shadow-xl shadow-black/5">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2.5">
                  <span className="bg-white/20 p-2 rounded-xl">🌟</span> Mari Ukir Prestasi!
                </h3>
                <p className="text-emerald-50/95 leading-relaxed font-medium text-[15px] md:text-base">
                  Ini adalah langkah besar dalam perjalanan karirmu. Jadikan setiap tugas sebagai peluang untuk belajar, berkembang, dan menunjukkan potensi terbaikmu. Selalu jaga nama baik almamater kampus, bangun relasi profesional yang tulus, dan berikan kontribusi nyata bagi perusahaan. Ingat, dedikasi yang kamu tanam hari ini adalah fondasi kokoh untuk kesuksesan karirmu di masa depan. Tetap semangat dan pantang menyerah! 🔥
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-transform hover:-translate-y-1 flex flex-col justify-between">
                  <div>
                    <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="text-base">🎯</span> Posisi Magang</p>
                    <p className="font-bold text-lg xl:text-xl text-white">{userPengajuan.posisi_id?.nama_posisi || userPengajuan.detail_tempat?.posisi || 'Posisi Magang'}</p>
                  </div>
                </div>
                
                <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-transform hover:-translate-y-1 flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="text-base">👨‍🏫</span> Dosen Pembimbing</p>
                    <p className="font-bold text-lg xl:text-xl text-white line-clamp-2">{userPengajuan.dpl_id?.nama_lengkap || 'Belum ditugaskan'}</p>
                  </div>
                  {userPengajuan.dpl_id?.nomor_hp && (
                    <a 
                      href={`https://wa.me/${userPengajuan.dpl_id.nomor_hp.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo Bapak/Ibu ${userPengajuan.dpl_id.nama_lengkap}, saya ${session?.user?.nama_lengkap} mahasiswa bimbingan magang Bapak/Ibu.`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold rounded-xl transition-colors mt-auto"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Hubungi WA
                    </a>
                  )}
                </div>

                <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-transform hover:-translate-y-1 flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="text-base">👔</span> Mentor Instansi</p>
                    <p className="font-bold text-lg xl:text-xl text-white line-clamp-2">{userPengajuan.mentor_id?.nama_lengkap || 'Belum ditugaskan'}</p>
                  </div>
                  {userPengajuan.mentor_id?.nomor_hp && (
                    <a 
                      href={`https://wa.me/${userPengajuan.mentor_id.nomor_hp.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo Bapak/Ibu ${userPengajuan.mentor_id.nama_lengkap}, saya ${session?.user?.nama_lengkap} mahasiswa bimbingan magang Bapak/Ibu.`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold rounded-xl transition-colors mt-auto"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Hubungi WA
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            {/* Ilustrasi atau Elemen Dekoratif di Kanan (Opsional) */}
            <div className="hidden lg:flex shrink-0 w-72 h-72 bg-gradient-to-tr from-white/5 to-white/20 rounded-full items-center justify-center backdrop-blur-xl border-8 border-white/10 shadow-2xl relative z-10">
              <span className="text-9xl filter drop-shadow-2xl">🚀</span>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
