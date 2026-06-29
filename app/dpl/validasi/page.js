"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";

export default function DplValidasi() {
  const { data: session } = useSession();
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState('antrean'); // 'antrean' or 'histori'

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/logbook?role=dpl&userId=${session.user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setLogbooks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();
  }, [fetchData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleValidasi = async (id, newStatus) => {
    try {
      const res = await fetch('/api/logbook', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status_validasi: newStatus })
      });
      if (res.ok) {
        showToast(newStatus === 'divalidasi_dpl' ? "CPMK Akademik Berhasil Divalidasi!" : "Diminta revisi!");
        fetchData();
      } else {
        alert("Gagal memvalidasi");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
    }
  };

  return (
    <DashboardLayout title="Pantau Kegiatan Mahasiswa (DPL)">
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-8 py-3.5 rounded-full shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-300 font-bold flex items-center gap-2.5 border border-emerald-500">
          <span>✅</span> {toastMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-bold animate-pulse">Memuat antrean logbook...</div>
      ) : (
        <div className="space-y-6">
      <div className="flex space-x-1 bg-white dark:bg-slate-800 shadow-sm p-1.5 rounded-xl w-max border border-slate-200 dark:border-slate-700">
        <button
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'antrean' 
              ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400'
          }`}
          onClick={() => setActiveTab('antrean')}
        >
          ⏳ Perlu Perhatian
        </button>
        <button
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'histori' 
              ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400'
          }`}
          onClick={() => setActiveTab('histori')}
        >
          📭 Riwayat (Tervalidasi)
        </button>
      </div>

          {/* Header Card */}
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Riwayat & Pemantauan Logbook Mahasiswa</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Pantau kegiatan harian mahasiswa bimbingan Anda. Ingatkan Mentor jika mahasiswa kurang mendapatkan eksposur yang relevan dengan target CPMK.</p>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 whitespace-nowrap w-48">Mahasiswa & Tgl</th>
                    <th className="py-4 px-6">Deskripsi Kegiatan</th>
                    <th className="py-4 px-6 text-right w-64">Status Validasi Mentor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {logbooks.filter(log => activeTab === 'antrean' ? log.status_validasi === 'menunggu_mentor' : log.status_validasi !== 'menunggu_mentor').length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        <div className="text-4xl mb-3">{activeTab === 'antrean' ? '📚' : '📭'}</div>
                        {activeTab === 'antrean' ? 'Semua logbook sudah divalidasi oleh Mentor.' : 'Belum ada riwayat logbook yang divalidasi.'}
                      </td>
                    </tr>
                  ) : (
                    logbooks.filter(log => activeTab === 'antrean' ? log.status_validasi === 'menunggu_mentor' : log.status_validasi !== 'menunggu_mentor').map((log) => (
                      <tr key={log._id} className="hover:bg-white dark:bg-slate-800 shadow-sm transition-colors">
                        <td className="py-5 px-6 align-top">
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{log.mahasiswa_id?.nama_lengkap}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-1 bg-slate-100 dark:bg-slate-800 w-fit px-2 py-1 rounded-md">{new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </td>
                        <td className="py-5 px-6 align-top">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{log.deskripsi_kegiatan}</p>
                          
                          <div className="mt-4 flex flex-wrap gap-2 items-start">
                            {log.bukti_kegiatan && (
                              <a href={log.bukti_kegiatan} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap shadow-sm">
                                <span>🖼️</span> Lihat Bukti Kegiatan
                              </a>
                            )}

                            <details className="group">
                              <summary className="cursor-pointer text-[11px] font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 select-none flex items-center gap-1.5 w-fit bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full transition-colors border border-indigo-100 dark:border-indigo-800/30">
                                <span className="group-open:rotate-90 transition-transform text-[10px]">▶</span>
                                Lihat Capaian Target CPMK
                              </summary>
                              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200 w-[500px] max-w-full">
                                {log.matched_indicators && log.matched_indicators.length > 0 ? (
                                  <div className="flex flex-col gap-1.5">
                                    {log.matched_indicators.map((ind, idx) => (
                                      <div key={idx} className="flex gap-2 items-start bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                        <span className="text-xs mt-0.5 shrink-0">⭐</span>
                                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 leading-snug break-words">
                                          {ind.nama_cpmk}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
                                    <span className="text-sm">💡</span> Belum memenuhi target CPMK
                                  </span>
                                )}
                              </div>
                            </details>
                          </div>
                        </td>
                        <td className="py-5 px-6 align-top text-right">
                          {log.status_validasi === 'menunggu_mentor' && (
                            <div className="flex flex-col items-end gap-3">
                              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 inline-flex items-center gap-1.5 shadow-sm">
                                <span>⏳</span> Menunggu Mentor
                              </span>
                              <div className="flex flex-col xl:flex-row gap-2">
                                <a 
                                  href={`https://wa.me/?text=Halo%20Bapak/Ibu%20Mentor,%20mohon%20bantuannya%20untuk%20memvalidasi%20logbook%20magang%20atas%20nama%20${log.mahasiswa_id?.nama_lengkap}.%20Terima%20kasih!`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <span>💬</span> Ingatkan via WA
                                </a>
                                <button 
                                  onClick={() => handleValidasi(log._id, 'divalidasi_mentor')}
                                  className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <span>✅</span> Bantu Validasi
                                </button>
                              </div>
                            </div>
                          )}
                          {log.status_validasi === 'revisi' && (
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm inline-flex items-center gap-1.5">
                              <span>❌</span> Diminta Revisi
                            </span>
                          )}
                          {(log.status_validasi === 'divalidasi_mentor' || log.status_validasi === 'divalidasi_dpl') && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm inline-flex items-center gap-1.5">
                              <span>✅</span> Divalidasi Lapangan
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
