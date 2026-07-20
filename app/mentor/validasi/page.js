"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";

export default function MentorValidasi() {
  const { data: session } = useSession();
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState('antrean'); // 'antrean' or 'histori'
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedCpmk, setExpandedCpmk] = useState({});
  const [expandedMhs, setExpandedMhs] = useState({});
  const [pagePerMhs, setPagePerMhs] = useState({});
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);

  const openDocsModal = (docs) => {
    setSelectedDocs(docs);
    setShowDocsModal(true);
  };

  const toggleCpmk = (id) => {
    setExpandedCpmk(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMhs = (mhsId) => {
    setExpandedMhs(prev => ({
      ...prev,
      [mhsId]: !prev[mhsId]
    }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [antreanRes, historiRes] = await Promise.all([
        fetch(`/api/logbook?role=mentor&userId=${session.user.id}`),
        fetch(`/api/logbook?role=mentor_histori&userId=${session.user.id}`)
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
  }, [session]);

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    if (session?.user?.id) {
      fetchData();
    }
  }, [fetchData, session]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleValidasi = async (id, newStatus, catatan_revisi = "") => {
    if (newStatus === 'revisi' && !catatan_revisi) return; // Prevent empty reason
    setSubmitting(true);
    try {
      const payload = { id, status_validasi: newStatus };
      if (catatan_revisi) payload.catatan_revisi = catatan_revisi;

      const res = await fetch('/api/logbook', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(newStatus === 'divalidasi_mentor' ? "Fakta Kegiatan Divalidasi!" : "Diminta revisi!");
        if (newStatus === 'revisi') {
          setShowRejectModal(false);
          setRejectReason("");
          setSelectedLogId(null);
        }
        fetchData();
      } else {
        alert("Gagal memvalidasi");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const openRejectModal = (id) => {
    setSelectedLogId(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

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

  return (
    <DashboardLayout title="Validasi Faktual (Mentor)">
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
          onClick={() => { setActiveTab('antrean'); setCurrentPage(1); }}
        >
          ⏳ Antrean Validasi
        </button>
        <button
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'histori' 
              ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400'
          }`}
          onClick={() => { setActiveTab('histori'); setCurrentPage(1); }}
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
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 whitespace-nowrap w-[20%]">Mahasiswa & Tgl</th>
                    <th className="py-4 px-6 w-[55%]">Deskripsi Kegiatan</th>
                    <th className="py-4 px-6 text-right w-[25%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(() => {
                    const filteredLogbooks = logbooks.filter(log => activeTab === 'antrean' ? log.status_validasi === 'menunggu_mentor' : log.status_validasi !== 'menunggu_mentor');
                    if (filteredLogbooks.length === 0) {
                      return (
                        <tr>
                          <td colSpan="3" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                            <div className="text-4xl mb-3">{activeTab === 'antrean' ? '🎉' : '📭'}</div>
                            {activeTab === 'antrean' ? 'Tidak ada logbook menunggu validasi lapangan Anda.' : 'Belum ada riwayat logbook yang Anda validasi/revisi.'}
                          </td>
                        </tr>
                      );
                    }
                    // Grouping
                    const groupedLogbooks = filteredLogbooks.reduce((acc, log) => {
                      const mhsId = log.mahasiswa_id?._id || 'unknown';
                      if (!acc[mhsId]) {
                        acc[mhsId] = {
                          mahasiswa: log.mahasiswa_id,
                          logbooks: []
                        };
                      }
                      acc[mhsId].logbooks.push(log);
                      return acc;
                    }, {});
                    const groupedArray = Object.values(groupedLogbooks);
                    
                    return (
                      <>
                        {groupedArray.map((group) => {
                          const mhsId = group.mahasiswa?._id || 'unknown';
                          const mhsName = group.mahasiswa?.nama_lengkap || 'Unknown';
                          const isExpanded = expandedMhs[mhsId];
                          const currentPage = pagePerMhs[mhsId] || 1;
                          const totalPages = Math.ceil(group.logbooks.length / itemsPerPage);
                          const currentLogbooks = group.logbooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                          return (
                            <React.Fragment key={mhsId}>
                              {/* Accordion Header */}
                              <tr 
                                onClick={() => toggleMhs(mhsId)}
                                className="bg-slate-100/50 dark:bg-slate-800/80 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors border-b border-white/5"
                              >
                                <td colSpan="3" className="py-4 px-6">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shadow-sm">
                                        {mhsName.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{mhsName}</p>
                                        <div className="flex gap-2 mt-1">
                                          <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded flex items-center text-[10px] font-bold">
                                            {group.logbooks.length} Logbook
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                      ▼
                                    </div>
                                  </div>
                                </td>
                              </tr>

                              {/* Accordion Body */}
                              {isExpanded && currentLogbooks.map((log) => (
                                <React.Fragment key={log._id}>
                                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900/20">
                                    <td className="py-4 px-6 align-top pl-10 border-l-4 border-l-indigo-200 dark:border-l-indigo-900">
                                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Kegiatan Harian</p>
                                      <p className="text-[11px] font-semibold text-slate-500 mt-1.5 bg-slate-100 dark:bg-slate-800 w-fit px-2 py-1 rounded-md">{new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    </td>
                                    <td className="py-4 px-6 align-top">
                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{log.deskripsi_kegiatan}</p>
                                    </td>
                                    <td className="py-4 px-6 align-top text-right">
                                      <div className="flex flex-row flex-wrap items-start justify-end gap-2">
                                        {/* Action Buttons */}
                                        {log.dokumentasi && log.dokumentasi.length > 0 ? (
                                          <button 
                                            onClick={() => openDocsModal(log.dokumentasi)}
                                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors whitespace-nowrap shadow-sm cursor-pointer"
                                          >
                                            <span>🖼️</span> {log.dokumentasi.length} Bukti
                                          </button>
                                        ) : log.bukti_kegiatan ? (
                                          <button onClick={() => handleViewFile(log.bukti_kegiatan)} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors whitespace-nowrap shadow-sm cursor-pointer">
                                            <span>🖼️</span> Bukti
                                          </button>
                                        ) : null}
                                        <button 
                                          onClick={() => toggleCpmk(log._id)}
                                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap shadow-sm cursor-pointer"
                                        >
                                          <span>🎯</span> Capaian
                                        </button>

                                        {/* Validation Status / Actions */}
                                        {activeTab === 'antrean' ? (
                                          <>
                                            <button 
                                              onClick={() => handleValidasi(log._id, 'divalidasi_mentor')}
                                              disabled={submitting}
                                              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 inline-flex items-center gap-1.5"
                                            >
                                              <span>✅</span> Validasi
                                            </button>
                                            <button 
                                              onClick={() => openRejectModal(log._id)}
                                              disabled={submitting}
                                              className="px-4 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[11px] rounded-lg transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 inline-flex items-center gap-1.5"
                                            >
                                              <span>❌</span> Revisi
                                            </button>
                                          </>
                                        ) : (
                                          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border shadow-sm inline-flex items-center gap-1.5 ${
                                            log.status_validasi === 'revisi' 
                                              ? 'text-rose-600 bg-rose-50 border-rose-200' 
                                              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                          }`}>
                                            <span>{log.status_validasi === 'revisi' ? '❌' : '✅'}</span>
                                            {log.status_validasi === 'revisi' ? 'Direvisi' : 'Divalidasi'}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                  
                                  {/* Expandable CPMK Row */}
                                  {expandedCpmk[log._id] && (
                                    <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-900/20">
                                      <td colSpan="3" className="px-6 pb-5 pt-0 pl-10 border-l-4 border-l-indigo-200 dark:border-l-indigo-900">
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 w-full">
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
                                                      {ind.alasan && (
                                                        <div className="mt-1.5 p-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded border border-indigo-200/50 dark:border-indigo-800/50">
                                                          <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                                                            <span className="font-bold text-indigo-700 dark:text-indigo-400 mr-1">Analisis Kegiatan:</span>
                                                            {ind.alasan}
                                                          </p>
                                                        </div>
                                                      )}
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
                                                <p className="text-[11px] text-amber-600 dark:text-amber-400/80 leading-relaxed mt-1">Kegiatan ini bersifat rutinitas. Mohon arahkan mahasiswa untuk melakukan variasi tugas lain agar target magang tercapai.</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}

                              {/* Pagination per Mhs */}
                              {isExpanded && totalPages > 1 && (
                                <tr className="bg-white dark:bg-slate-900/20">
                                  <td colSpan="3" className="py-5 px-6 border-l-4 border-l-indigo-200 dark:border-l-indigo-900">
                                    <div className="flex justify-center items-center gap-2">
                                      <button 
                                        onClick={() => setPagePerMhs(prev => ({ ...prev, [mhsId]: Math.max(1, (prev[mhsId] || 1) - 1) }))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                                      >
                                        Sebelumnya
                                      </button>
                                      
                                      <div className="flex items-center gap-1 hidden sm:flex">
                                        {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                                          <button
                                            key={page}
                                            onClick={() => setPagePerMhs(prev => ({ ...prev, [mhsId]: page }))}
                                            className={`w-8 h-8 rounded-xl text-[11px] font-bold flex items-center justify-center transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                          >
                                            {page}
                                          </button>
                                        ))}
                                      </div>
                                      
                                      <div className="sm:hidden text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
                                        Hal {currentPage} dari {totalPages}
                                      </div>
                  
                                      <button 
                                        onClick={() => setPagePerMhs(prev => ({ ...prev, [mhsId]: Math.min(totalPages, (prev[mhsId] || 1) + 1) }))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                                      >
                                        Selanjutnya
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </>
                    );
                })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Revisi */}
      {showRejectModal && selectedLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-rose-600 dark:text-rose-400">Minta Revisi Logbook</h3>
                <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-xl">&times;</button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Mohon tuliskan dengan jelas bagian mana yang harus diperbaiki oleh mahasiswa pada logbook hari ini.</p>
              
              <textarea
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Deskripsi terlalu singkat, mohon jelaskan apa saja tugas spesifik yang kamu kerjakan hari ini..."
                className="w-full h-32 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium text-slate-800 dark:text-slate-100"
              ></textarea>
              
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleValidasi(selectedLogId, 'revisi', rejectReason)}
                  disabled={submitting || !rejectReason.trim()}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2 rounded-xl shadow-lg shadow-rose-600/20 transition-all"
                >
                  {submitting ? 'Memproses...' : 'Kirim Revisi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dokumentasi */}
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
    </DashboardLayout>
  );
}
