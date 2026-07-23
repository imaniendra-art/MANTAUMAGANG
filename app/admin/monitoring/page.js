"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

// Sub-komponen untuk mengambil dan menampilkan logbook per mahasiswa
function StudentLogbookList({ mahasiswaId }) {
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const itemsPerPage = 5;

  const openDocsModal = (docs) => {
    setSelectedDocs(docs);
    setShowDocsModal(true);
  };

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

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse text-sm">Mengambil data logbook...</div>;
  if (logbooks.length === 0) return <div className="p-8 text-center text-slate-500 text-sm">Belum ada riwayat logbook.</div>;

  const totalPages = Math.ceil(logbooks.length / itemsPerPage);
  const currentLogbooks = logbooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-4">Narasi Kegiatan</th>
                <th className="py-3 px-4 w-48">Capaian CPMK</th>
                <th className="py-3 px-4 w-16 text-center">Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {currentLogbooks.map(log => (
                <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 px-4 align-top whitespace-nowrap">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </td>
                  
                  <td className="py-3 px-4 align-top">
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{log.deskripsi_kegiatan}</p>
                  </td>
                  
                  <td className="py-3 px-4 align-top">
                    {log.matched_indicators && log.matched_indicators.length > 0 ? (
                      <details className="group">
                        <summary className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 select-none flex items-center gap-1">
                          <span className="group-open:rotate-90 transition-transform text-[9px]">▶</span>
                          {log.matched_indicators.length} Target Terpenuhi
                        </summary>
                        <div className="mt-1.5 pl-2 border-l-2 border-indigo-100 dark:border-indigo-900/30 space-y-1.5 py-1">
                          {log.matched_indicators.map((ind, idx) => (
                            <div key={idx} className="mb-1">
                              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase leading-tight">
                                {ind.matkul_nama ? <span className="text-indigo-600 mr-1">{ind.matkul_nama} : </span> : null}
                                {ind.nama_cpmk}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Tidak ada</span>
                    )}
                    
                    {log.extracted_skills && log.extracted_skills.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <span>🧠</span> Skill Dilatih
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {log.extracted_skills.map((skill, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-medium rounded border border-emerald-100 dark:border-emerald-800/50 line-clamp-1 max-w-full" title={skill}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  
                  <td className="py-3 px-4 align-top text-center">
                    {log.dokumentasi && log.dokumentasi.length > 0 ? (
                      <div className="inline-block w-full">
                        <button 
                          onClick={() => openDocsModal(log.dokumentasi)}
                          className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 p-2 rounded-md transition-colors border border-blue-200 dark:border-blue-800/50 shadow-sm w-full flex justify-center items-center gap-1.5"
                        >
                          <span>🖼️</span> <span className="text-[10px]">{log.dokumentasi.length}</span>
                        </button>
                      </div>
                    ) : log.bukti_kegiatan ? (
                      <button onClick={() => handleViewFile(log.bukti_kegiatan)} title="Lihat Bukti" className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 p-2 rounded-md transition-colors border border-blue-200 dark:border-blue-800/50 shadow-sm w-full flex justify-center items-center">
                        🖼️
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan <span className="font-medium text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, logbooks.length)}</span> dari <span className="font-medium text-slate-800 dark:text-slate-200">{logbooks.length}</span> logbook
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {showDocsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Dokumentasi Kegiatan</h3>
              <button onClick={() => setShowDocsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              {selectedDocs.map((doc, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="w-full aspect-video rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden mb-3 relative flex items-center justify-center group cursor-pointer" onClick={() => handleViewFile(doc.file)}>
                    {doc.file.includes('.pdf') ? (
                       <span className="text-5xl">📄</span>
                    ) : (
                       <img src={doc.file} alt="" className="object-contain w-full h-full" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                      <span className="bg-white/90 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">Buka File</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed text-center">
                    {doc.keterangan || "Tidak ada keterangan."}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end shrink-0">
              <button 
                onClick={() => setShowDocsModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MonitoringLogbookPage() {
  const [pengajuans, setPengajuans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(filteredPengajuans.length / itemsPerPage);
  const currentData = filteredPengajuans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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
                    currentData.map((p) => (
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Menampilkan <span className="font-medium text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredPengajuans.length)}</span> dari <span className="font-medium text-slate-800 dark:text-slate-200">{filteredPengajuans.length}</span> data
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
