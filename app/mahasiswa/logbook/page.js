"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";

export default function LogbookPage() {
  const { data: session } = useSession();
  
  const [pengajuan, setPengajuan] = useState(null);
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form State
  const getTodayLocal = () => {
    if (typeof window === 'undefined') return "";
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    return (new Date(today - tzOffset)).toISOString().split('T')[0];
  };
  
  const [tanggal, setTanggal] = useState("");
  const [absensiSelected, setAbsensiSelected] = useState(null);
  
  // Set default date on mount
  useEffect(() => {
    setTanggal(getTodayLocal());
  }, []);

  useEffect(() => {
    if (session?.user?.id && tanggal) {
      fetch(`/api/absensi?mhsId=${session.user.id}&tanggal=${tanggal}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) setAbsensiSelected(data[0]);
          else setAbsensiSelected(null);
        })
        .catch(console.error);
    }
  }, [session, tanggal]);

  const [deskripsi, setDeskripsi] = useState("");
  const [buktiLink, setBuktiLink] = useState("");
  const [buktiFoto, setBuktiFoto] = useState("");
  const [editingLogId, setEditingLogId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [achievementToast, setAchievementToast] = useState(null);
  const [showMisi, setShowMisi] = useState(false); // State for Accordion Misi Magang
  const [expandedCpmk, setExpandedCpmk] = useState({});

  const toggleCpmk = (id) => {
    setExpandedCpmk(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const resP = await fetch(`/api/pengajuan?mhsId=${session.user.id}`);
      const dataP = await resP.json();
      setPengajuan(dataP);

      if (dataP && dataP.status_pengajuan === 'disetujui') {
        const resL = await fetch(`/api/logbook?mhsId=${session.user.id}`);
        const dataL = await resL.json();
        setLogbooks(Array.isArray(dataL) ? dataL : []);
      }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file maksimal 2MB");
        e.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBuktiFoto(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setBuktiFoto("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pengajuan || pengajuan.status_pengajuan !== 'disetujui') return;
    
    if (deskripsi.trim().split(/\s+/).length < 20) {
      alert("Deskripsi kegiatan terlalu singkat. Mohon tuliskan minimal 20 kata yang menjelaskan Situasi, Tugas, Aksi, dan Hasil (Metode STAR).");
      return;
    }
    
    if (!buktiFoto) {
      alert("Wajib mengunggah file bukti kegiatan nyata di lapangan.");
      return;
    }
    
    setSubmitting(true);

    try {
      // 1. Call AI Matching
      const aiRes = await fetch('/api/ai/match-indicator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengajuan_id: pengajuan._id,
          deskripsi_kegiatan: deskripsi
        })
      });
      
      const aiData = await aiRes.json();
      if (aiData.error) throw new Error(aiData.error);
      const matched_indicators = aiData.matched || [];
      
      // 2. Save Logbook
      const payload = {
        pengajuan_id: pengajuan._id,
        mahasiswa_id: session.user.id,
        tanggal,
        deskripsi_kegiatan: deskripsi,
        matched_indicators,
        bukti_link: buktiLink,
        bukti_kegiatan: buktiFoto
      };

      let res;
      if (editingLogId) {
        payload.id = editingLogId;
        payload.status_validasi = 'menunggu_mentor'; // Reset status
        res = await fetch('/api/logbook', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/logbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setTanggal("");
        setDeskripsi("");
        setBuktiLink("");
        setBuktiFoto("");
        setEditingLogId(null);
        
        // Custom UI Reset for file input
        const fileInput = document.getElementById("file-upload");
        if (fileInput) fileInput.value = "";
        
        if (matched_indicators.length > 0) {
           const uniqueCpmk = new Set(matched_indicators.map(m=>m.nama_cpmk)).size;
           setAchievementToast(`Luar biasa! Kegiatan ini mencakup ${matched_indicators.length} indikator untuk ${uniqueCpmk} CPMK. 🎉`);
           setTimeout(() => setAchievementToast(null), 8000);
        } else {
           showToast("Logbook tersimpan, namun sistem belum menemukan indikator spesifik yang sesuai deskripsimu.");
        }
        
        fetchData();
      } else {
        const err = await res.json();
        alert("Gagal: " + err.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem AI: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (log) => {
    setEditingLogId(log._id);
    setTanggal(new Date(log.tanggal).toISOString().split('T')[0]);
    setDeskripsi(log.deskripsi_kegiatan);
    setBuktiLink(log.bukti_link || "");
    setBuktiFoto(log.bukti_kegiatan || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setTanggal(getTodayLocal());
    setDeskripsi("");
    setBuktiLink("");
    setBuktiFoto("");
    const fileInput = document.getElementById("file-upload");
    if (fileInput) fileInput.value = "";
  };

  // Get status badge UI
  const getStatusBadge = (status) => {
    switch (status) {
      case 'menunggu_mentor': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md">Menunggu Mentor</span>;
      case 'divalidasi_mentor': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">Divalidasi Mentor</span>;
      case 'divalidasi_dpl': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">Divalidasi DPL</span>;
      case 'revisi': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md">Revisi</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">{status}</span>;
    }
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
    <DashboardLayout title="Logbook Harian (OBE)">
      {toastMessage && (
        <div className="fixed top-24 right-8 bg-green-500 text-slate-800 dark:text-slate-100 px-6 py-3 rounded-xl shadow-lg shadow-green-500/30 z-50 animate-in slide-in-from-right-10 fade-in duration-300 font-bold">
          {toastMessage}
        </div>
      )}
      
      {achievementToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-orange-500/40 z-50 animate-in zoom-in-90 slide-in-from-top-10 fade-in duration-500 flex flex-col items-center">
          <span className="text-3xl mb-1">🏅</span>
          <p className="font-bold text-center text-lg shadow-black/10 drop-shadow-sm">{achievementToast}</p>
          <p className="text-xs text-white/80 mt-1">Pencapaian akan tervalidasi setelah dikonfirmasi Mentor.</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Memuat data logbook...</div>
      ) : !pengajuan || pengajuan.status_pengajuan !== 'disetujui' ? (
        <div className="max-w-2xl mx-auto mt-10 animate-in zoom-in-95 duration-500">
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🔒</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Akses Logbook Terkunci</h2>
            <p className="text-slate-600">
              Logbook Harian Anda akan terbuka **setelah** pengajuan magang Anda disetujui oleh Program Studi dan DPL ditugaskan.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* KIRI: Form Pengisian & Misi Magang */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Panel Misi Magang */}
            {pengajuan.paket_matkul_id && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div 
                  className="p-5 flex justify-between items-center cursor-pointer bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors"
                  onClick={() => setShowMisi(!showMisi)}
                >
                  <div>
                    <h3 className="text-sm font-black text-indigo-900 flex items-center gap-2">
                      <span>✨</span> Peta Perjalanan Magang Berdampakmu
                    </h3>
                    <p className="text-[10px] font-bold text-indigo-700/70 mt-0.5">Lihat apa yang diharapkan kampus dari pengalaman berhargamu di sini.</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-400 font-bold transition-transform duration-300 ${showMisi ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>
                
                {showMisi && (
                  <div className="p-5 border-t border-indigo-100/50 space-y-5 animate-in slide-in-from-top-2 fade-in duration-300 max-h-[500px] overflow-y-auto custom-scrollbar bg-indigo-50/10">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-sm text-white">
                      <p className="text-[11px] leading-relaxed font-medium">
                        Halo! Magang ini bukan sekadar rutinitas, tapi petualangan untuk membentuk karakter dan *skill* profesionalmu. Setiap cerita hebat yang kamu tulis di logbook akan dinilai oleh AI kami untuk mencocokkan pengalamanmu dengan target pencapaian (CPMK) di bawah ini. Semangat berkarya! 🚀
                      </p>
                    </div>
                    
                    {pengajuan.paket_matkul_id.mata_kuliah?.map((mk, idx) => (
                      <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-indigo-100 text-indigo-700 uppercase tracking-widest">{mk.kode}</span>
                          <span className="text-sm font-black text-slate-800">{mk.nama}</span>
                        </div>
                        <div className="space-y-3">
                          {mk.cpmk?.map((c, i) => (
                            <div key={i} className="pl-3 border-l-2 border-indigo-200">
                              <p className="font-bold text-slate-700 text-xs leading-snug">{c.nama_cpmk}</p>
                              {c.saran_kegiatan && (
                                <div className="mt-2 p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/50">
                                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider block mb-1">💡 Ide Aksi di Lapangan:</span>
                                  <span className="text-amber-800 font-medium text-[11px] leading-relaxed block">{c.saran_kegiatan}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Form Pengisian */}
            <div className={`bg-white rounded-3xl border ${editingLogId ? 'border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-slate-200 shadow-sm'} overflow-hidden sticky top-28 transition-all`}>
              <div className={`p-6 border-b ${editingLogId ? 'border-rose-100 bg-rose-50/50' : 'border-slate-100 bg-indigo-50/30'}`}>
                <h3 className={`text-lg font-bold ${editingLogId ? 'text-rose-700' : 'text-slate-900'}`}>
                  {editingLogId ? '✏️ Perbaiki Logbook' : 'Tulis Logbook Baru'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {editingLogId ? 'Silakan perbaiki deskripsi kegiatan sesuai arahan revisi.' : `Isi berdasarkan aktivitas rill di ${pengajuan.detail_tempat?.nama}.`}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Kegiatan</label>
                  <input required value={tanggal} onChange={(e) => setTanggal(e.target.value)} type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium" />
                  
                  {tanggal && absensiSelected && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 items-start animate-in fade-in">
                      <span className="text-emerald-500 shrink-0">✅</span>
                      <div className="text-xs text-emerald-700 font-medium leading-relaxed">
                        <strong>Check-In Tercatat: {absensiSelected.status.toUpperCase()}</strong>
                        {absensiSelected.status === 'hadir' && absensiSelected.rencana_kegiatan && (
                          <p className="mt-1 opacity-80 line-clamp-2">Target hari ini: {absensiSelected.rencana_kegiatan}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi Kegiatan</label>
                  <p className="text-xs text-slate-500 mb-2">Ceritakan dengan detail. Gunakan pola STAR (Situasi, Tugas, Aksi, Hasil). Minimal 20 kata.</p>
                  <textarea required minLength="100" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows="5" placeholder="Contoh: Hari ini saya ditugaskan oleh mentor untuk menganalisis alur kerja di divisi operasional. Saya melakukan wawancara dengan 3 staf dan berhasil memetakan bahwa kelemahan utama berada di lambatnya proses cetak dokumen. Saya mencatat hal ini dan merencanakan pembuatan sistem antrean besok." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 text-sm leading-relaxed"></textarea>
                  <p className={`text-xs mt-1 text-right font-medium ${deskripsi.trim().split(/\s+/).length < 20 ? 'text-red-500' : 'text-green-600'}`}>{deskripsi.trim() === "" ? 0 : deskripsi.trim().split(/\s+/).length} / 20 kata</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Upload Bukti (Foto/PDF) <span className="text-red-500">*</span></label>
                    <input required id="file-upload" type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Link Google Drive / URL (Opsional)</label>
                    <input value={buktiLink} onChange={(e) => setBuktiLink(e.target.value)} type="url" placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  {editingLogId && (
                    <button 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="w-1/3 py-3.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    >
                      Batal
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className={`${editingLogId ? 'w-2/3 bg-rose-600 hover:bg-rose-700' : 'w-full bg-indigo-600 hover:bg-indigo-700'} py-3.5 text-sm font-bold text-white rounded-xl shadow-md transition-all disabled:opacity-50`}
                  >
                    {submitting ? 'Menyimpan...' : (editingLogId ? 'Simpan Perbaikan' : 'Simpan Logbook')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* KANAN: Riwayat Logbook */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Riwayat Kegiatan Anda</h3>
            
            {logbooks.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-slate-500 font-medium">Belum ada riwayat logbook. Mulai tulis kegiatan pertama Anda hari ini!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logbooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(log => (
                  <div key={log._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                          {new Date(log.tanggal).getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', month: 'short', year: 'numeric' })}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Disubmit pada {new Date(log.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {log.bukti_kegiatan && (
                          <button onClick={() => handleViewFile(log.bukti_kegiatan)} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors shadow-sm cursor-pointer">
                            <span>🖼️</span> Bukti File
                          </button>
                        )}
                        {log.bukti_link && (
                          <a href={log.bukti_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors shadow-sm">
                            <span>🔗</span> Link Bukti
                          </a>
                        )}
                        <button 
                          onClick={() => toggleCpmk(log._id)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm cursor-pointer"
                        >
                          <span>🎯</span> Capaian
                        </button>
                        <div className="w-[1px] h-6 bg-slate-200 mx-1 hidden sm:block"></div>
                        {getStatusBadge(log.status_validasi)}
                      </div>
                    </div>
                    
                    {log.status_validasi === 'revisi' && log.catatan_revisi && (
                      <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                        <div className="flex gap-2 items-start">
                          <span className="text-rose-500 mt-0.5">⚠️</span>
                          <div>
                            <p className="text-xs font-black text-rose-700 uppercase tracking-wider mb-1">Catatan Revisi dari Mentor:</p>
                            <p className="text-sm text-rose-800 font-medium leading-relaxed">{log.catatan_revisi}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-slate-700 text-sm mt-4 leading-relaxed">{log.deskripsi_kegiatan}</p>
                    
                    {expandedCpmk[log._id] && (
                      <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                          {log.status_validasi === 'menunggu_mentor' || log.status_validasi === 'revisi' ? (
                            <div className="flex gap-3 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 w-full max-w-md">
                              <span className="text-lg">🔒</span>
                              <span className="text-xs text-slate-600 font-bold leading-relaxed">Menunggu evaluasi dari mentor untuk membuka daftar capaian kegiatan ini.</span>
                            </div>
                          ) : log.matched_indicators && log.matched_indicators.length > 0 ? (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 w-full">
                              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <span>🎯</span> {log.matched_indicators.length} Target CPMK Terpenuhi
                              </p>
                              <div className="space-y-3">
                                {log.matched_indicators.map((ind, idx) => (
                                  <div key={idx} className="flex gap-2.5 items-start">
                                    <div className="text-amber-400 text-xs mt-0.5 shrink-0">⭐</div>
                                    <div>
                                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm inline-block mb-1 border border-slate-100 dark:border-slate-700">
                                        {ind.matkul_nama ? <span className="text-indigo-600 mr-1">[{ind.matkul_kode} {ind.matkul_nama}]</span> : null}
                                        {ind.nama_cpmk}
                                      </p>
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
                            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3.5 border border-amber-200 dark:border-amber-800/50 flex gap-2 items-start w-full">
                              <span className="text-amber-500">💡</span>
                              <div>
                                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-0.5">
                                  Tidak Memenuhi Target CPMK
                                </p>
                                <p className="text-[11px] text-amber-600 dark:text-amber-400/80 leading-relaxed mt-1">Kegiatan ini bersifat rutinitas. Coba diskusikan dengan Mentor untuk tugas yang lebih menantang esok hari.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {log.status_validasi === 'revisi' && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => handleEditClick(log)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
                          >
                            <span>✏️</span> Perbaiki Logbook Ini
                          </button>
                        </div>
                      )}
                    </div>
                ))}
                
                {/* Pagination Controls */}
                {Math.ceil(logbooks.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 pt-4">
                    <button 
                      onClick={() => {
                        setCurrentPage(p => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
                    >
                      Sebelumnya
                    </button>
                    
                    <div className="flex items-center gap-1 hidden sm:flex">
                      {Array.from({length: Math.ceil(logbooks.length / itemsPerPage)}, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <div className="sm:hidden text-sm font-bold text-slate-500 px-2">
                      Hal {currentPage} dari {Math.ceil(logbooks.length / itemsPerPage)}
                    </div>

                    <button 
                      onClick={() => {
                        setCurrentPage(p => Math.min(Math.ceil(logbooks.length / itemsPerPage), p + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === Math.ceil(logbooks.length / itemsPerPage)}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
        </div>
      )}
    </DashboardLayout>
  );
}
