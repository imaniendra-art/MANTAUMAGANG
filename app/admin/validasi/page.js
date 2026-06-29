"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ValidasiPengajuan() {
  const [activeTab, setActiveTab] = useState('menunggu');
  const [pengajuans, setPengajuans] = useState([]);
  const [dpls, setDpls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State Validasi
  const [showModal, setShowModal] = useState(false);
  const [selectedPengajuan, setSelectedPengajuan] = useState(null);
  const [selectedDplId, setSelectedDplId] = useState("");
  
  // Modal State Penolakan
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fetchData = useCallback(async (status) => {
    await Promise.resolve();
    setLoading(true);
    try {
      const [pengajuanRes, dplRes] = await Promise.all([
        fetch(`/api/pengajuan?admin=true&status=${status}`),
        fetch('/api/users/dpl')
      ]);
      const pengajuanData = await pengajuanRes.json();
      const dplData = await dplRes.json();
      
      if (Array.isArray(pengajuanData)) setPengajuans(pengajuanData);
      if (Array.isArray(dplData)) setDpls(dplData);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(activeTab);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData, activeTab]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleValidasiClick = (p) => {
    setSelectedPengajuan(p);
    setSelectedDplId("");
    setShowModal(true);
  };

  const handleRejectClick = (p) => {
    setSelectedPengajuan(p);
    setRejectReason(`Pengajuan ditolak. Silakan pilih posisi magang yang sesuai dengan Konsentrasi Anda (${p.mahasiswa_id?.konsentrasi || 'yang terdaftar'}).`);
    setShowRejectModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDplId || !selectedPengajuan) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/pengajuan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPengajuan._id,
          dpl_id: selectedDplId,
          status_pengajuan: 'disetujui'
        })
      });
      
      if (res.ok) {
        setShowModal(false);
        showToast("✅ Validasi Berhasil & DPL Ditugaskan!");
        fetchData(activeTab);
      } else {
        const errData = await res.json();
        alert("Gagal memvalidasi: " + errData.error);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPengajuan || !rejectReason) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/pengajuan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPengajuan._id,
          status_pengajuan: 'ditolak',
          alasan_penolakan: rejectReason
        })
      });
      
      if (res.ok) {
        setShowRejectModal(false);
        showToast("⚠️ Pengajuan Berhasil Ditolak");
        fetchData(activeTab);
      } else {
        const errData = await res.json();
        alert("Gagal menolak: " + errData.error);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Validasi & Data Pengajuan">
      
      {toastMessage && (
        <div className="fixed top-24 right-8 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-6 py-3 rounded-xl shadow-lg z-50 animate-in slide-in-from-right-10 fade-in duration-300 font-bold">
          {toastMessage}
        </div>
      )}

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            
            {/* TABS HEADER */}
            <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex px-2 sm:px-6 overflow-x-auto hide-scrollbar">
                <button
                  className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'menunggu' 
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  onClick={() => setActiveTab('menunggu')}
                >
                  ⏳ Antrean Validasi
                </button>
                <button
                  className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'disetujui' 
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  onClick={() => setActiveTab('disetujui')}
                >
                  ✅ Daftar Data yang Sudah Divalidasi
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-4 text-center">No</th>
                    {activeTab === 'menunggu' ? (
                      <>
                        <th className="py-4 px-4 text-center">NIM</th>
                        <th className="py-4 px-4 text-left">Nama</th>
                        <th className="py-4 px-4 text-center">Konsentrasi</th>
                        <th className="py-4 px-4 text-left">Instansi Tujuan</th>
                        <th className="py-4 px-4 text-left">Posisi Tujuan</th>
                        <th className="py-4 px-4 text-center">Status</th>
                        <th className="py-4 px-4 text-center whitespace-nowrap">Lihat CV</th>
                        <th className="py-4 px-4 text-center">Aksi</th>
                      </>
                    ) : (
                      <>
                        <th className="py-4 px-4 text-left">Mahasiswa & Kontak</th>
                        <th className="py-4 px-4 text-left">Lokasi & Posisi</th>
                        <th className="py-4 px-4 text-left">Dosen Pembimbing (DPL)</th>
                        <th className="py-4 px-4 text-left">Mentor Industri</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 relative">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-20 text-center">
                        <div className="inline-block w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-3"></div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">Memuat data...</p>
                      </td>
                    </tr>
                  ) : pengajuans.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        <div className="text-4xl mb-3">🎉</div>
                        Semua pengajuan telah tervalidasi! Tidak ada antrean baru.
                      </td>
                    </tr>
                  ) : (
                    pengajuans.map((p, index) => {
                      const konsentrasiMhs = p.mahasiswa_id?.konsentrasi || '-';
                      const konsentrasiPosisi = p.posisi_id?.konsentrasi || '-';
                      const isMatch = konsentrasiMhs === konsentrasiPosisi;
                      const instansiTujuan = p.posisi_id?.mitra_id?.nama_instansi || p.mitra_id?.nama_instansi || p.detail_tempat?.nama || '-';
                      const posisiTujuan = p.posisi_id?.nama_posisi || p.detail_tempat?.posisi || '-';

                      return (
                      <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm">
                        <td className="py-4 px-4 text-center font-medium text-slate-500 dark:text-slate-400">{index + 1}</td>
                        {activeTab === 'menunggu' ? (
                          <>
                            <td className="py-4 px-4 text-center font-medium text-slate-500 dark:text-slate-400">{p.mahasiswa_id?.nim_nidn}</td>
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-800 dark:text-slate-100">{p.mahasiswa_id?.nama_lengkap}</p>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-block px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {konsentrasiMhs}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-semibold text-slate-700 dark:text-slate-200">{instansiTujuan}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${p.jenis_skema === 'instansi' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'}`}>
                                {p.jenis_skema === 'instansi' ? 'Corporate' : 'Wirausaha'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-medium text-slate-600 dark:text-slate-300">{posisiTujuan}</p>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {p.jenis_skema === 'instansi' ? (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${isMatch ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 whitespace-nowrap'}`}>
                                  {isMatch ? '✅ Sesuai' : '⚠️ Konsentrasi tidak sesuai dengan pilihan posisi'}
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center">
                              {p.file_cv_path ? (
                                <a href={p.file_cv_path.startsWith('/') ? p.file_cv_path : '/' + p.file_cv_path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors" title="Lihat CV">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </a>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button 
                                  onClick={() => handleRejectClick(p)}
                                  className="px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Tolak
                                </button>
                                <button 
                                  onClick={() => handleValidasiClick(p)}
                                  className="px-3 py-1.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Tugaskan DPL
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-800 dark:text-slate-100">{p.mahasiswa_id?.nama_lengkap}</p>
                              <p className="text-xs text-slate-500 font-medium">{p.mahasiswa_id?.nim_nidn} • {p.mahasiswa_id?.nomor_hp || '-'}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-700 dark:text-slate-200">{instansiTujuan}</p>
                              <p className="text-xs text-slate-500 line-clamp-1">{posisiTujuan} • {p.detail_tempat?.alamat || '-'}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-bold text-indigo-600 dark:text-indigo-400">{p.dpl_id?.nama_lengkap || '-'}</p>
                              <p className="text-xs text-slate-500">{p.dpl_id?.nomor_hp || 'Belum ada kontak'}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="inline-block px-2.5 py-1 rounded border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                                <p className="font-bold text-[11px] text-slate-600 dark:text-slate-300">By Sistem / Mitra</p>
                                <p className="text-[10px] text-slate-400">Akan ditugaskan instansi</p>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Modal Penolakan */}
      {showRejectModal && selectedPengajuan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-red-50 dark:bg-red-500/10 backdrop-blur-xl">
              <h3 className="text-lg font-black text-red-500 dark:text-red-400">Tolak Pengajuan</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-red-400 font-bold text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleRejectSubmit}>
              <div className="p-6 space-y-4">
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Anda akan menolak pengajuan <strong>{selectedPengajuan.mahasiswa_id?.nama_lengkap}</strong> ke <strong>{selectedPengajuan.detail_tempat?.nama}</strong>.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Alasan Penolakan</label>
                  <textarea 
                    required 
                    rows={4}
                    value={rejectReason} 
                    onChange={(e) => setRejectReason(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-medium"
                    placeholder="Masukkan alasan penolakan..."
                  ></textarea>
                  <p className="text-xs text-slate-500 mt-2">Alasan ini akan ditampilkan di dashboard mahasiswa.</p>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowRejectModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/80 rounded-xl transition-colors">
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting || !rejectReason}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-[0_4px_15px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Menyimpan...' : 'Tolak Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Penugasan DPL */}
      {showModal && selectedPengajuan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Validasi & Tugaskan DPL</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-red-400 font-bold text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                
                {/* Rangkuman Pengajuan */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Mahasiswa</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{selectedPengajuan.mahasiswa_id?.nama_lengkap}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Tempat Magang</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{selectedPengajuan.detail_tempat?.nama}</p>
                    </div>
                  </div>
                </div>

                {/* Pemilihan DPL */}
                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Pilih Dosen Pembimbing Lapangan (DPL)</label>
                  <select 
                    required 
                    value={selectedDplId} 
                    onChange={(e) => setSelectedDplId(e.target.value)} 
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-medium appearance-none"
                  >
                    <option value="" disabled>-- Pilih DPL yang Tersedia --</option>
                    {dpls.map(dpl => (
                      <option key={dpl._id} value={dpl._id}>{dpl.nama_lengkap}</option>
                    ))}
                  </select>
                </div>
                
              </div>
              
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/80 rounded-xl transition-colors">
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting || !selectedDplId}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-[0_4px_15px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Menyimpan...' : 'Setujui & Tugaskan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
