"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function MentorValidasi() {
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState('antrean'); // 'antrean' or 'histori'

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [antreanRes, historiRes] = await Promise.all([
        fetch('/api/logbook?role=mentor'),
        fetch('/api/logbook?role=mentor_histori')
      ]);
      const antreanData = await antreanRes.json();
      const historiData = await historiRes.json();
      
      const combined = [
        ...(Array.isArray(antreanData) ? antreanData : []),
        ...(Array.isArray(historiData) ? historiData : [])
      ];
      setLogbooks(combined);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    // Optimistic UI Update: Langsung pindahkan statusnya (hilang dari antrean, pindah ke histori)
    setLogbooks(prev => prev.map(log => 
      log._id === id ? { ...log, status_validasi: newStatus } : log
    ));
    
    try {
      const res = await fetch('/api/logbook', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status_validasi: newStatus })
      });
      if (res.ok) {
        showToast(newStatus === 'divalidasi_mentor' ? "Fakta Kegiatan Divalidasi!" : "Diminta revisi!");
      } else {
        alert("Gagal memvalidasi");
        fetchData(); // revert
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
      fetchData(); // revert
    }
  };

  return (
    <DashboardLayout title="Validasi Faktual (Mentor)">
      {toastMessage && (
        <div className="fixed top-24 right-8 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-6 py-3 rounded-xl shadow-lg z-50 animate-in slide-in-from-right-10 fade-in duration-300 font-bold backdrop-blur-sm">
          {toastMessage}
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
          ⏳ Antrean Validasi
        </button>
        <button
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'histori' 
              ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400'
          }`}
          onClick={() => setActiveTab('histori')}
        >
          📭 Riwayat (Histori)
        </button>
      </div>

          {/* Header Card */}
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Validasi Logbook Harian</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verifikasi secara faktual apakah deskripsi kegiatan mahasiswa benar-benar dilakukan di instansi Anda.</p>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold">
                    <th className="py-4 px-6">Mahasiswa & Tgl</th>
                    <th className="py-4 px-6">Deskripsi Kegiatan</th>
                    <th className="py-4 px-6">Bukti</th>
                    <th className="py-4 px-6 text-right w-48">{activeTab === 'antrean' ? 'Aksi' : 'Status Terakhir'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {logbooks.filter(log => activeTab === 'antrean' ? log.status_validasi === 'menunggu_mentor' : log.status_validasi !== 'menunggu_mentor').length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        <div className="text-4xl mb-3">{activeTab === 'antrean' ? '🎉' : '📭'}</div>
                        {activeTab === 'antrean' ? 'Tidak ada logbook menunggu validasi lapangan Anda.' : 'Belum ada riwayat logbook yang Anda validasi/revisi.'}
                      </td>
                    </tr>
                  ) : (
                    logbooks.filter(log => activeTab === 'antrean' ? log.status_validasi === 'menunggu_mentor' : log.status_validasi !== 'menunggu_mentor').map((log) => (
                      <tr key={log._id} className="hover:bg-white dark:bg-slate-800 shadow-sm transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{log.mahasiswa_id?.nama_lengkap}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">{new Date(log.tanggal).toLocaleDateString('id-ID')}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{log.deskripsi_kegiatan}</p>
                          {log.matched_indicators && log.matched_indicators.length > 0 ? (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/50">
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <span>🤖</span> Temuan AI: {log.matched_indicators.length} Target Terpenuhi
                              </p>
                              <div className="space-y-2">
                                {log.matched_indicators.map((ind, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <div className="text-indigo-400 text-xs mt-0.5">⭐</div>
                                    <div>
                                      <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-indigo-950/50 px-1.5 py-0.5 rounded shadow-sm inline-block mb-0.5">{ind.nama_cpmk}</p>
                                      <p className="text-[11px] text-indigo-600 dark:text-indigo-300 font-medium leading-snug">{ind.indikator}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <span>🤖</span> AI Tidak Menemukan Target
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">Rutinitas biasa, tidak ada poin kurikulum.</p>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {log.bukti_kegiatan ? (
                            <a href={log.bukti_kegiatan} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30">Lihat Bukti</a>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Tidak ada</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                          {activeTab === 'antrean' ? (
                            <>
                              <button 
                                onClick={() => handleValidasi(log._id, 'revisi')}
                                className="px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-bold text-xs rounded-lg transition-colors"
                              >
                                Minta Revisi
                              </button>
                              <button 
                                onClick={() => handleValidasi(log._id, 'divalidasi_mentor')}
                                className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-600 hover:text-white font-bold text-xs rounded-lg transition-colors border border-emerald-500/30"
                              >
                                Validasi Faktanya
                              </button>
                            </>
                          ) : (
                            <>
                              {log.status_validasi === 'revisi' && (
                                <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">❌ Diminta Revisi</span>
                              )}
                              {(log.status_validasi === 'divalidasi_mentor' || log.status_validasi === 'divalidasi_dpl') && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">✅ Divalidasi Lapangan</span>
                              )}
                            </>
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
