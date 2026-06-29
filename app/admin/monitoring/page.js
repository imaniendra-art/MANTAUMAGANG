"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function MonitoringLogbookPage() {
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logbook?role=admin');
      const data = await res.json();
      setLogbooks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLogbooks = logbooks.filter(log => {
    const searchLower = searchQuery.toLowerCase();
    const nama = log.mahasiswa_id?.nama_lengkap?.toLowerCase() || "";
    const nim = log.mahasiswa_id?.nim_nidn?.toLowerCase() || "";
    return nama.includes(searchLower) || nim.includes(searchLower);
  });

  const handleViewFile = (dataUrl) => {
    try {
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) {
        window.open(dataUrl, '_blank');
        return;
      }
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error("Gagal membuka file:", e);
      window.open(dataUrl, '_blank');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'menunggu_mentor': return <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold rounded-lg shadow-sm">⏳ Menunggu Mentor</span>;
      case 'divalidasi_mentor': return <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg shadow-sm">🔹 Divalidasi Mentor</span>;
      case 'divalidasi_dpl': return <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg shadow-sm">✅ Divalidasi DPL</span>;
      case 'revisi': return <span className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg shadow-sm">❌ Direvisi</span>;
      default: return <span className="px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg shadow-sm">{status}</span>;
    }
  };

  return (
    <DashboardLayout title="Monitoring Magang">
      <div className="space-y-6">
        {/* Header & Search */}
        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="w-full md:w-auto">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Monitoring Logbook</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Pantau seluruh aktivitas logbook mahasiswa dari semua prodi dan mitra.
            </p>
          </div>
          <div className="w-full md:w-auto flex shrink-0 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              🔍
            </div>
            <input
              type="text"
              placeholder="Cari nama atau NIM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-900 font-medium text-sm text-slate-900 dark:text-white transition-all"
            />
          </div>
        </div>

        {/* Table Card */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Memuat data logbook...</div>
        ) : (
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 whitespace-nowrap w-56">Mahasiswa & Tgl</th>
                    <th className="py-4 px-6 w-48">Penempatan</th>
                    <th className="py-4 px-6">Deskripsi Kegiatan</th>
                    <th className="py-4 px-6 text-center w-40">Status & Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredLogbooks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                        <div className="text-4xl mb-3">📭</div>
                        Tidak ada riwayat logbook yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredLogbooks.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="py-5 px-6 align-top">
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{log.mahasiswa_id?.nama_lengkap}</p>
                          <p className="text-xs text-slate-500 font-medium">{log.mahasiswa_id?.nim_nidn}</p>
                          <p className="text-[11px] font-bold text-indigo-600 mt-2 bg-indigo-50 w-fit px-2 py-1 rounded-md">
                            {new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="py-5 px-6 align-top">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {log.pengajuan_id?.detail_tempat?.nama || log.pengajuan_id?.posisi_id?.mitra_id?.nama_instansi || 'Mitra'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {log.pengajuan_id?.detail_tempat?.posisi || log.pengajuan_id?.posisi_id?.nama_posisi || 'Posisi Magang'}
                          </p>
                        </td>
                        <td className="py-5 px-6 align-top">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{log.deskripsi_kegiatan}</p>
                          <details className="mt-4 group">
                            <summary className="cursor-pointer text-[11px] font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 select-none flex items-center gap-1.5 w-fit bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full transition-colors border border-indigo-100 dark:border-indigo-800/30">
                              <span className="group-open:rotate-90 transition-transform text-[10px]">▶</span>
                              Lihat Capaian Target CPMK
                            </summary>
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                              {log.matched_indicators && log.matched_indicators.length > 0 ? (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <span>🎯</span> {log.matched_indicators.length} Target CPMK Terpenuhi
                                  </p>
                                  <div className="space-y-3">
                                    {log.matched_indicators.map((ind, idx) => (
                                      <div key={idx} className="flex gap-2.5 items-start">
                                        <div className="text-amber-400 text-xs mt-0.5 shrink-0">⭐</div>
                                        <div>
                                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm inline-block mb-1 border border-slate-100 dark:border-slate-700">{ind.nama_cpmk}</p>
                                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{ind.indikator}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3.5 border border-amber-200 dark:border-amber-800/50 flex gap-2 items-start">
                                  <span className="text-amber-500">💡</span>
                                  <div>
                                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-0.5">
                                      Tidak Memenuhi Target CPMK
                                    </p>
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400/80 leading-relaxed mt-1">Kegiatan ini bersifat rutinitas biasa.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        </td>
                        <td className="py-5 px-6 align-top text-center space-y-3 flex flex-col items-center">
                          {getStatusBadge(log.status_validasi)}
                          
                          {log.bukti_kegiatan ? (
                            <button onClick={() => handleViewFile(log.bukti_kegiatan)} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shadow-sm mt-2 w-full justify-center cursor-pointer">
                              <span>🖼️</span> Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100 mt-2 block w-full text-center">Tanpa bukti</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
