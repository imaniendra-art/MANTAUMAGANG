"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function PencapaianContent() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [analisis, setAnalisis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/logbook/analisis?mhsId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setAnalisis(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [session]);

  return (
    <>
      {/* MODAL ACHIEVEMENT */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
            
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-center relative overflow-hidden">
              <div className="absolute -right-8 -top-8 text-8xl opacity-20 pointer-events-none">⭐</div>
              <div className="text-6xl mb-2 relative z-10 drop-shadow-md">🏅</div>
              <h2 className="text-2xl font-black text-white relative z-10 drop-shadow-sm">Pencapaian Unlocked!</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Matakuliah</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedAchievement.matkul}</p>
              </div>
              
              <div className="mb-4">
                <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded">Target (CPMK)</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedAchievement.nama_cpmk}</p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Berhasil dicapai pada: <strong>{new Date(selectedAchievement.achieved_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</strong></p>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{selectedAchievement.achieved_desc}"</p>
              </div>
              
              <button 
                onClick={() => setSelectedAchievement(null)}
                className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <DashboardLayout title="Papan Pencapaian">

        {loading ? (
          <div className="h-64 bg-[#0F172A]/5 dark:bg-slate-800/20 rounded-3xl animate-pulse"></div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  🏆 Papan Pencapaian (CPMK)
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Kumpulkan target CPMK dengan mengisi logbook kegiatan harianmu.
                </p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Progress</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">
                  {analisis?.achievements?.filter(a => a.status === 'tercapai').length || 0} <span className="text-lg opacity-50">/ {analisis?.achievements?.length || 0}</span>
                </span>
              </div>
            </div>
            
            {(!analisis?.achievements || analisis.achievements.length === 0) ? (
              <div className="py-12 text-center text-slate-500">
                Belum ada target pencapaian untuk pengajuan magangmu saat ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {analisis.achievements.map((ach, i) => (
                  <button 
                    key={i}
                    onClick={() => ach.status === 'tercapai' && setSelectedAchievement(ach)}
                    disabled={ach.status !== 'tercapai'}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col text-left h-full ${
                      ach.status === 'tercapai' 
                        ? 'bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:scale-105 z-10 cursor-pointer' 
                        : ach.status === 'pending'
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 border-dashed cursor-not-allowed'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 grayscale opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                        ach.status === 'tercapai' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-orange-500/50 ring-4 ring-amber-100 dark:ring-amber-900/30' : 
                        ach.status === 'pending' ? 'bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-200' :
                        'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}>
                        {ach.status === 'tercapai' ? '⭐' : ach.status === 'pending' ? '⏳' : '🔒'}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700 max-w-[120px] truncate text-center">
                        {ach.matkul}
                      </span>
                    </div>
                    
                    <h4 className={`text-sm font-bold leading-snug line-clamp-4 mb-4 flex-1 ${
                      ach.status === 'tercapai' ? 'text-amber-900 dark:text-amber-100' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {ach.nama_cpmk}
                    </h4>
                    
                    <div className="mt-auto">
                      {ach.status === 'tercapai' ? (
                        <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-1.5 rounded-lg text-center shadow-sm">✅ Klik untuk lihat detail</div>
                      ) : ach.status === 'pending' ? (
                        <div className="text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1.5 rounded-lg text-center shadow-sm animate-pulse">Menunggu Validasi</div>
                      ) : (
                        <div className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1.5 rounded-lg text-center shadow-inner">Belum ada aktivitas</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </DashboardLayout>
    </>
  );
}

export default function PencapaianPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Memuat Papan Pencapaian...</div>}>
      <PencapaianContent />
    </Suspense>
  );
}
