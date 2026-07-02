"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

// Sub-komponen untuk mengambil dan menampilkan logbook per mahasiswa
function StudentLogbookList({ mahasiswaId }) {
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/logbook?mhsId=${mahasiswaId}`)
      .then(r => r.json())
      .then(data => {
        if (isMounted) {
          setLogbooks(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(e => {
        console.error(e);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [mahasiswaId]);

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
      case 'menunggu_mentor': return <span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-[10px] font-bold rounded shadow-sm">⏳ Menunggu Mentor</span>;
      case 'divalidasi_mentor': return <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded shadow-sm">🔹 Divalidasi Mentor</span>;
      case 'divalidasi_dpl': return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded shadow-sm">✅ Divalidasi DPL</span>;
      case 'revisi': return <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded shadow-sm">❌ Direvisi</span>;
      default: return <span className="px-2 py-1 bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold rounded shadow-sm">{status}</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse text-sm">Mengambil data logbook...</div>;
  if (logbooks.length === 0) return <div className="p-8 text-center text-slate-500 text-sm">Belum ada riwayat logbook.</div>;

  return (
    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="space-y-4">
        {logbooks.map(log => (
          <div key={log._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="shrink-0 w-40 border-r border-slate-100 dark:border-slate-700 pr-4">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {new Date(log.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <div className="mt-2">{getStatusBadge(log.status_validasi)}</div>
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 font-medium">{log.deskripsi_kegiatan}</p>
              
              {/* CPMK Indicators */}
              {log.matched_indicators && log.matched_indicators.length > 0 && (
                <details className="mt-2 group">
                  <summary className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 select-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform text-[10px]">▶</span>
                    {log.matched_indicators.length} Target CPMK Terpenuhi
                  </summary>
                  <div className="mt-2 pl-3 border-l-2 border-indigo-100 dark:border-indigo-900/30 space-y-2 py-1">
                    {log.matched_indicators.map((ind, idx) => (
                      <div key={idx} className="mb-2">
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">{ind.nama_cpmk}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{ind.indikator}</p>
                        {ind.alasan && (
                          <div className="mt-1 p-1.5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded border border-indigo-100/50 dark:border-indigo-800/30">
                            <p className="text-[10px] text-indigo-700 dark:text-indigo-400">
                              <span className="font-bold mr-1">Analisis Kegiatan:</span>
                              {ind.alasan}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
            
            {log.bukti_kegiatan && (
              <div className="shrink-0">
                <button onClick={() => handleViewFile(log.bukti_kegiatan)} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200">
                  🖼️ Bukti
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MonitoringLogbookPage() {
  const [pengajuans, setPengajuans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pengajuan?admin=true&status=disetujui');
      const data = await res.json();
      setPengajuans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPengajuans = pengajuans.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    const nama = p.mahasiswa_id?.nama_lengkap?.toLowerCase() || "";
    const nim = p.mahasiswa_id?.nim_nidn?.toLowerCase() || "";
    return nama.includes(searchLower) || nim.includes(searchLower);
  });

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
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
              Pantau aktivitas mahasiswa per individu. Klik "Lihat Logbook" untuk menampilkan riwayat kegiatan mereka.
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
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Memuat data mahasiswa...</div>
        ) : (
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 whitespace-nowrap">Mahasiswa</th>
                    <th className="py-4 px-6">Lokasi Magang</th>
                    <th className="py-4 px-6">DPL</th>
                    <th className="py-4 px-6">Mentor</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredPengajuans.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                        <div className="text-4xl mb-3">📭</div>
                        Tidak ada mahasiswa magang aktif ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredPengajuans.map((p) => (
                      <React.Fragment key={p._id}>
                        <tr className={`transition-colors ${expandedId === p.mahasiswa_id?._id ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/20'}`}>
                          <td className="py-4 px-6 align-middle">
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{p.mahasiswa_id?.nama_lengkap}</p>
                            <p className="text-xs text-slate-500 font-medium">{p.mahasiswa_id?.nim_nidn}</p>
                          </td>
                          <td className="py-4 px-6 align-middle">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              {p.detail_tempat?.nama || p.posisi_id?.mitra_id?.nama_instansi || '-'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {p.detail_tempat?.posisi || p.posisi_id?.nama_posisi || '-'}
                            </p>
                          </td>
                          <td className="py-4 px-6 align-middle">
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{p.dpl_id?.nama_lengkap || <span className="text-slate-400 italic">Belum diset</span>}</p>
                          </td>
                          <td className="py-4 px-6 align-middle">
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{p.mentor_id?.nama_lengkap || <span className="text-slate-400 italic">Belum diset</span>}</p>
                          </td>
                          <td className="py-4 px-6 align-middle text-center">
                            <button 
                              onClick={() => toggleExpand(p.mahasiswa_id?._id)}
                              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50 dark:hover:bg-indigo-900/50"
                            >
                              <span>📋</span> {expandedId === p.mahasiswa_id?._id ? 'Tutup Logbook' : 'Lihat Logbook'}
                            </button>
                          </td>
                        </tr>
                        {/* Expandable Row Content */}
                        {expandedId === p.mahasiswa_id?._id && (
                          <tr>
                            <td colSpan="5" className="p-0 border-b-2 border-indigo-200 dark:border-indigo-800/50">
                              <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                <StudentLogbookList mahasiswaId={p.mahasiswa_id?._id} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
