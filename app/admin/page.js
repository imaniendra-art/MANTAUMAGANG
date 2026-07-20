"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch dashboard stats:", err);
        setLoading(false);
      });
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-32 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl" />
            <div className="h-32 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl" />
            <div className="h-32 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl" />
            <div className="h-32 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 h-80 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl" />
            <div className="lg:col-span-2 h-80 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl" />
          </div>
        </div>
      );
    }

    if (!stats) return null;

    const fillRatio = stats.totalPosisiTersedia > 0 ? (stats.posisiTerisi / stats.totalPosisiTersedia) * 100 : 0;
    
    const activeKonsentrasi = stats.konsentrasiStats || [];
    const totalKonsentrasi = activeKonsentrasi.reduce((acc, curr) => acc + curr.kuota, 0) || 1;

    return (
      <div className="w-full space-y-10">
        {!stats.hasActivePeriode && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-2xl shadow-sm">
            <div className="flex items-start gap-4">
              <div className="text-red-500 text-3xl">⚠️</div>
              <div>
                <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-1">Perhatian: Periode Aktif Belum Diatur!</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Saat ini tidak ada periode magang yang aktif. Mahasiswa tidak akan dapat melakukan pengajuan atau mengakses fitur magang. Anda diwajibkan untuk membuat atau mengaktifkan periode magang terlebih dahulu.
                </p>
                <Link href="/admin/settings" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                  Atur Periode Sekarang
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
          
          {/* Card 1: Total Mitra */}
          <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-blue-500/10 dark:bg-blue-500/20 blur-[30px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Mitra</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.totalMitra}</p>
              
              {/* Stacked Bar Sebaran */}
              <div className="mt-3">
                <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 h-1.5 flex rounded-full overflow-hidden">
                  {activeKonsentrasi.map(item => {
                    const pct = (item.kuota / totalKonsentrasi) * 100;
                    let bg = 'bg-blue-500';
                    if (item.name === 'SDM') bg = 'bg-emerald-500';
                    if (item.name === 'Keuangan') bg = 'bg-amber-500';
                    if (item.name === 'Pemasaran') bg = 'bg-pink-500';
                    if (item.name === 'Pengembangan Bisnis') bg = 'bg-purple-500';
                    return <div key={item.name} className={`${bg} h-full transition-all`} style={{ width: `${pct}%` }} title={`${item.name}: ${item.kuota} slot`} />;
                  })}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-1 gap-y-1 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1 truncate"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"/> SDM</div>
                  <div className="flex items-center gap-1 truncate"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"/> Keu</div>
                  <div className="flex items-center gap-1 truncate"><div className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0"/> Pemas.</div>
                  <div className="flex items-center gap-1 truncate"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"/> Bisnis</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Posisi Magang */}
          <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[30px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Posisi Magang</p>
              <div className="flex items-end gap-1.5 mt-2">
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{stats.totalPosisiTersedia}</p>
                <p className="text-xs font-bold text-slate-500 pb-1">slot</p>
              </div>
              <div className="mt-1.5 flex justify-between items-center text-[10px] font-bold">
                <span className="text-indigo-600 dark:text-indigo-400">{stats.posisiTerisi} Terisi</span>
                <span className="text-slate-500 dark:text-slate-400">{stats.totalPosisiTersedia - stats.posisiTerisi} Kosong</span>
              </div>
              <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 h-1.5 mt-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${fillRatio}%` }} />
              </div>
            </div>
          </div>

          {/* Card 3: Total Ajuan */}
          <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[30px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Pengajuan Masuk</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">{stats.totalAjuan}</p>
            </div>
          </div>

          {/* Card 4: Antrean Validasi */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-md ${stats.antreanValidasi > 0 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : 'bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none'}`}>
            <div className={`absolute -bottom-10 -right-10 w-28 h-28 blur-[30px] rounded-full pointer-events-none ${stats.antreanValidasi > 0 ? 'bg-amber-500/20' : 'bg-slate-500/10 dark:bg-slate-500/20'}`} />
            <div className="relative z-10">
              <p className={`text-sm font-semibold ${stats.antreanValidasi > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>Antrean Validasi</p>
              <p className={`text-3xl font-black mt-2 ${stats.antreanValidasi > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>{stats.antreanValidasi}</p>
              {stats.antreanValidasi > 0 && (
                <span className="absolute top-0 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </div>
          </div>

          {/* Card 5: Live Feed (Replaces Sebaran Konsentrasi) */}
          <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-md xl:col-span-2">
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-red-500/10 dark:bg-red-500/20 blur-[30px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-2.5">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Live Feed</p>
                <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold uppercase tracking-wider animate-pulse">Live</span>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-2">
                {stats.aktivitasTerbaru?.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-2">Belum ada aktivitas</p>
                ) : (
                  stats.aktivitasTerbaru?.slice(0, 2).map((akt) => (
                    <div key={akt._id} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[8px] ${akt.status === 'menunggu' ? 'bg-amber-100 text-amber-600' : akt.status === 'disetujui' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {akt.status === 'menunggu' ? '⏳' : akt.status === 'disetujui' ? '✅' : '❌'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{akt.nama_mahasiswa}</p>
                        <p className="text-[9px] text-slate-500 truncate">{akt.aktivitas || akt.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <DashboardLayout 
      title="Dashboard Admin & Prodi" 
      notifications={renderContent()}
      heroRightContent={
        stats?.hasActivePeriode ? (
          <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 px-5 py-3 rounded-xl flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">Periode Aktif</p>
              <p className="text-sm font-black text-indigo-900 dark:text-indigo-300">{stats.activePeriodeName}</p>
            </div>
          </div>
        ) : null
      }
    >
    </DashboardLayout>
  );
}
