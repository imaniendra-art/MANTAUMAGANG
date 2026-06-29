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
                  <tr className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold">
                    <th className="py-4 px-6">Mahasiswa & Tgl</th>
                    <th className="py-4 px-6">Temuan AI (CPMK)</th>
                    <th className="py-4 px-6">Deskripsi Kegiatan</th>
                    <th className="py-4 px-6 text-right w-48">Status Validasi Mentor</th>
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
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{log.mahasiswa_id?.nama_lengkap}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">{new Date(log.tanggal).toLocaleDateString('id-ID')}</p>
                        </td>
                        <td className="py-4 px-6">
                          {log.matched_indicators && log.matched_indicators.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {log.matched_indicators.map((ind, idx) => (
                                <span key={idx} className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded inline-block break-words max-w-full">
                                  ⭐ {ind.nama_cpmk}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Tidak ada target</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mb-3">{log.deskripsi_kegiatan}</p>
                          {log.bukti_kegiatan && (
                            <a href={log.bukti_kegiatan} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors">
                              <span>🔗</span> Lihat Bukti Kegiatan
                            </a>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                          {log.status_validasi === 'menunggu_mentor' && (
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 inline-flex items-center gap-1">
                                ⏳ Menunggu Mentor
                              </span>
                              <div className="flex gap-2">
                                <a 
                                  href={`https://wa.me/?text=Halo%20Bapak/Ibu%20Mentor,%20mohon%20bantuannya%20untuk%20memvalidasi%20logbook%20magang%20atas%20nama%20${log.mahasiswa_id?.nama_lengkap}.%20Terima%20kasih!`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                >
                                  💬 Ingatkan via WA
                                </a>
                                <button 
                                  onClick={() => handleValidasi(log._id, 'divalidasi_mentor')}
                                  className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                >
                                  ✅ Bantu Validasi
                                </button>
                              </div>
                            </div>
                          )}
                          {log.status_validasi === 'revisi' && (
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">❌ Diminta Revisi</span>
                          )}
                          {(log.status_validasi === 'divalidasi_mentor' || log.status_validasi === 'divalidasi_dpl') && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">✅ Divalidasi Lapangan</span>
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
