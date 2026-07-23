"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import LogbookCalendar from "@/components/LogbookCalendar";

export default function LogbookPage() {
  const { data: session } = useSession();
  
  const [pengajuan, setPengajuan] = useState(null);
  const [logbooks, setLogbooks] = useState([]);
  const [rencanaKerja, setRencanaKerja] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filter State
  const [showAllLogbooks, setShowAllLogbooks] = useState(true);
  
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
  const [dokumentasi, setDokumentasi] = useState([]); // Array of { file: base64, keterangan: string }
  const [editingLogId, setEditingLogId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [achievementToast, setAchievementToast] = useState(null);
  const [showMisi, setShowMisi] = useState(false); // State for Accordion Misi Magang
  const [expandedCpmk, setExpandedCpmk] = useState({});
  const [expandedPhotos, setExpandedPhotos] = useState({});

  const toggleCpmk = (id) => {
    setExpandedCpmk(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePhotos = (id) => {
    setExpandedPhotos(prev => ({ ...prev, [id]: !prev[id] }));
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
        
        const resR = await fetch(`/api/mahasiswa/rencana-kerja?mhsId=${session.user.id}`);
        const dataR = await resR.json();
        setRencanaKerja(Array.isArray(dataR) ? dataR : []);
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


  const handleAddDokumentasi = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (dokumentasi.length >= 3) {
        alert("Maksimal 3 foto dokumentasi tambahan.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file maksimal 2MB");
        e.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDokumentasi(prev => [...prev, { file: reader.result, keterangan: "" }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDokumentasi = (index) => {
    setDokumentasi(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDokumentasi = (index, keterangan) => {
    setDokumentasi(prev => prev.map((item, i) => i === index ? { ...item, keterangan } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pengajuan || pengajuan.status_pengajuan !== 'disetujui') return;
    
    if (deskripsi.trim().split(/\s+/).length < 20) {
      alert("Deskripsi kegiatan terlalu singkat. Mohon tuliskan minimal 20 kata yang menjelaskan Situasi, Tugas, Aksi, dan Hasil (Metode STAR).");
      return;
    }
    
    if (dokumentasi.length === 0) {
      alert("Harap unggah minimal 1 foto dokumentasi kegiatan.");
      return;
    }
    
    // Pastikan semua dokumentasi ada keterangannya
    for (let i = 0; i < dokumentasi.length; i++) {
      if (!dokumentasi[i].keterangan.trim()) {
        alert(`Harap isi keterangan untuk foto ke-${i+1}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        mahasiswa_id: session.user.id,
        pengajuan_id: pengajuan._id,
        tanggal,
        deskripsi_kegiatan: deskripsi,
        bukti_link: buktiLink,
        bukti_kegiatan: dokumentasi[0].file, // untuk backward compatibility
        dokumentasi
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
        setTanggal(getTodayLocal());
        setDeskripsi("");
        setBuktiLink("");
        setDokumentasi([]);
        setEditingLogId(null);
        
        fetchData();
        showToast("Logbook berhasil disimpan.");
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
    
    // Backward compatibility: jika ada bukti_kegiatan lama tapi tidak ada dokumentasi
    if (log.bukti_kegiatan && (!log.dokumentasi || log.dokumentasi.length === 0)) {
      setDokumentasi([{ file: log.bukti_kegiatan, keterangan: "Bukti Kegiatan" }]);
    } else {
      setDokumentasi(log.dokumentasi || []);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setTanggal(getTodayLocal());
    setDeskripsi("");
    setBuktiLink("");
    setDokumentasi([]);
  };

  // Get status badge UI
  const getStatusBadge = (status) => {
    switch (status) {
      case 'menunggu_mentor': return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 text-xs font-bold rounded-md">Menunggu Mentor</span>;
      case 'divalidasi_mentor': return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-md">Divalidasi Mentor</span>;
      case 'divalidasi_dpl': return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-md">Divalidasi DPL</span>;
      case 'revisi': return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-md">Revisi</span>;
      default: return <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md">{status}</span>;
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
          <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🔒</div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Akses Logbook Terkunci</h2>
            <p className="text-slate-600 dark:text-slate-400">
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
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div 
                  className="p-5 flex justify-between items-center cursor-pointer bg-gradient-to-r from-indigo-50 dark:from-indigo-900/40 to-purple-50 dark:to-purple-900/40 hover:from-indigo-100 dark:hover:from-indigo-800/60 hover:to-purple-100 dark:hover:to-purple-800/60 transition-colors"
                  onClick={() => setShowMisi(!showMisi)}
                >
                  <div>
                    <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                      <span>✨</span> Peta Perjalanan Magang Berdampakmu
                    </h3>
                    <p className="text-[10px] font-bold text-indigo-700/70 dark:text-indigo-300 mt-0.5">Lihat apa yang diharapkan kampus dari pengalaman berhargamu di sini.</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-indigo-400 dark:text-indigo-300 font-bold transition-transform duration-300 ${showMisi ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>
                
                {showMisi && (
                  <div className="p-5 border-t border-indigo-100/50 dark:border-indigo-900/50 space-y-5 animate-in slide-in-from-top-2 fade-in duration-300 max-h-[500px] overflow-y-auto custom-scrollbar bg-indigo-50/10 dark:bg-slate-800/30">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-sm text-white">
                      <p className="text-[11px] leading-relaxed font-medium">
                        Halo! Magang ini bukan sekadar rutinitas, tapi petualangan untuk membentuk karakter dan *skill* profesionalmu. Setiap cerita hebat yang kamu tulis di logbook akan dinilai oleh AI kami untuk mencocokkan pengalamanmu dengan target pencapaian (CPMK) di bawah ini. Semangat berkarya! 🚀
                      </p>
                    </div>
                    
                    {pengajuan.paket_matkul_id.mata_kuliah?.map((mk, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">{mk.kode}</span>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100">{mk.nama}</span>
                        </div>
                        <div className="space-y-3">
                          {mk.cpmk?.map((c, i) => (
                            <div key={i} className="pl-3 border-l-2 border-indigo-200 dark:border-indigo-800">
                              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs leading-snug">{c.nama_cpmk}</p>
                              {c.saran_kegiatan && (
                                <div className="mt-2 p-2.5 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border border-amber-100/50 dark:border-amber-800/50">
                                  <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider block mb-1">💡 Ide Aksi di Lapangan:</span>
                                  <span className="text-amber-800 dark:text-amber-200 font-medium text-[11px] leading-relaxed block">{c.saran_kegiatan}</span>
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
            <div className={`bg-white dark:bg-slate-900 rounded-3xl border ${editingLogId ? 'border-rose-300 dark:border-rose-700/50 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-slate-200 dark:border-slate-700 shadow-sm'} overflow-hidden sticky top-28 transition-all`}>
              <div className={`p-6 border-b ${editingLogId ? 'border-rose-100 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/10' : 'border-slate-100 dark:border-slate-700 bg-indigo-50/30 dark:bg-slate-800/50'}`}>
                <h3 className={`text-lg font-bold ${editingLogId ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {editingLogId ? '✏️ Perbaiki Logbook' : 'Tulis Logbook Baru'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  {editingLogId ? 'Silakan perbaiki deskripsi kegiatan sesuai arahan revisi.' : `Isi berdasarkan aktivitas rill di ${pengajuan.detail_tempat?.nama}.`}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Tanggal Kegiatan</label>
                  <input required value={tanggal} onChange={(e) => setTanggal(e.target.value)} type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium color-scheme-light-dark" />
                  
                  {tanggal && absensiSelected && (
                    <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex gap-3 items-start animate-in fade-in">
                      <span className="text-emerald-500 shrink-0">✅</span>
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
                        <strong>Check-In Tercatat: {absensiSelected.status.toUpperCase()}</strong>
                        {absensiSelected.status === 'hadir' && absensiSelected.rencana_kegiatan && (
                          <p className="mt-1 opacity-80 line-clamp-2">Target hari ini: {absensiSelected.rencana_kegiatan}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Deskripsi Kegiatan</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Ceritakan dengan detail. Gunakan pola STAR (Situasi, Tugas, Aksi, Hasil). Minimal 20 kata.</p>
                  <textarea required minLength="100" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} onPaste={(e) => { e.preventDefault(); alert("Maaf, fitur paste dinonaktifkan. Harap ketik deskripsi secara manual untuk merefleksikan kegiatan Anda."); }} onCopy={(e) => e.preventDefault()} rows="5" placeholder="Contoh: Hari ini saya ditugaskan oleh mentor untuk menganalisis alur kerja di divisi operasional. Saya melakukan wawancara dengan 3 staf dan berhasil memetakan bahwa kelemahan utama berada di lambatnya proses cetak dokumen. Saya mencatat hal ini dan merencanakan pembuatan sistem antrean besok." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm leading-relaxed"></textarea>
                  <p className={`text-xs mt-1 text-right font-medium ${deskripsi.trim().split(/\s+/).length < 20 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-500'}`}>{deskripsi.trim() === "" ? 0 : deskripsi.trim().split(/\s+/).length} / 20 kata</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Link Google Drive / URL (Opsional)</label>
                    <input value={buktiLink} onChange={(e) => setBuktiLink(e.target.value)} type="url" placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-sm" />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Dokumentasi Kegiatan <span className="text-red-500">*</span> <span className="text-xs font-normal text-slate-500">(Wajib min 1, Maks 3 Foto)</span>
                    </label>
                    {dokumentasi.length < 3 && (
                      <label className="cursor-pointer text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                        + Tambah Foto
                        <input type="file" accept="image/*" className="hidden" onChange={handleAddDokumentasi} />
                      </label>
                    )}
                  </div>
                  
                  {dokumentasi.length > 0 ? (
                    <div className="space-y-3">
                      {dokumentasi.map((doc, idx) => (
                        <div key={idx} className="flex gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 items-start">
                          <img src={doc.file} alt={`Doc ${idx}`} className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-600 shrink-0" />
                          <div className="flex-grow">
                            <input 
                              type="text" 
                              required 
                              placeholder="Keterangan foto ini..." 
                              value={doc.keterangan} 
                              onChange={(e) => handleUpdateDokumentasi(idx, e.target.value)} 
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 mb-1" 
                            />
                            <p className="text-[10px] text-slate-500">Wajib diisi</p>
                          </div>
                          <button type="button" onClick={() => handleRemoveDokumentasi(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg shrink-0">
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-red-200 dark:border-red-900/30 text-red-500 text-xs font-medium">
                      Silakan tambah minimal 1 foto kegiatan.
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  {editingLogId && (
                    <button 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="w-1/3 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all"
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

            <LogbookCalendar 
              tanggalMulai={pengajuan?.tanggal_mulai}
              tanggalSelesai={pengajuan?.tanggal_selesai}
              logbooks={logbooks}
              rencanaKerja={rencanaKerja}
              selectedDate={tanggal}
              onDateClick={(d) => {
                setTanggal(d);
                setShowAllLogbooks(false);
                setCurrentPage(1);
              }}
              onSaveRencana={async (tgl, teks) => {
                try {
                  const res = await fetch('/api/mahasiswa/rencana-kerja', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mhsId: session.user.id, tanggal: tgl, teks })
                  });
                  if (res.ok) {
                    fetchData();
                    showToast("Rencana kerja berhasil disimpan!");
                  } else {
                    alert("Gagal menyimpan rencana kerja");
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
            />
          </div>

          {/* KANAN: Riwayat Logbook */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {showAllLogbooks ? 'Riwayat Kegiatan Anda' : `Riwayat: ${new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </h3>
              {!showAllLogbooks && (
                <button 
                  onClick={() => {
                    setShowAllLogbooks(true);
                    setCurrentPage(1);
                  }} 
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  Tampilkan Semua
                </button>
              )}
            </div>
            
            {(() => {
              const filteredLogbooks = showAllLogbooks 
                ? logbooks 
                : logbooks.filter(log => {
                    const logDate = new Date(log.tanggal);
                    const tzOffset = logDate.getTimezoneOffset() * 60000;
                    const logDateLocalStr = (new Date(logDate - tzOffset)).toISOString().split('T')[0];
                    return logDateLocalStr === tanggal;
                  });
              
              return filteredLogbooks.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada riwayat logbook pada tanggal ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogbooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(log => (
                  <div key={log._id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                          {new Date(log.tanggal).getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', month: 'short', year: 'numeric' })}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Disubmit pada {new Date(log.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {log.bukti_link && (
                          <a href={log.bukti_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/50 px-3 py-1.5 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors shadow-sm">
                            <span>🔗</span> Link Bukti
                          </a>
                        )}
                        <button 
                          onClick={() => toggleCpmk(log._id)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm cursor-pointer"
                        >
                          <span>🎯</span> Capaian
                        </button>
                        {(log.dokumentasi?.length > 0 || log.bukti_kegiatan) && (
                          <button 
                            onClick={() => togglePhotos(log._id)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm cursor-pointer"
                          >
                            <span>📸</span> Lihat Bukti
                          </button>
                        )}
                        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                        {getStatusBadge(log.status_validasi)}
                      </div>
                    </div>
                    
                    {log.status_validasi === 'revisi' && log.catatan_revisi && (
                      <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl">
                        <div className="flex gap-2 items-start">
                          <span className="text-rose-500 mt-0.5">⚠️</span>
                          <div>
                            <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">Catatan Revisi dari Mentor:</p>
                            <p className="text-sm text-rose-800 dark:text-rose-300 font-medium leading-relaxed">{log.catatan_revisi}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                      <p className="text-slate-700 dark:text-slate-300 text-sm mt-4 leading-relaxed whitespace-pre-line flex-grow">{log.deskripsi_kegiatan}</p>
                    </div>
                    
                    {expandedPhotos[log._id] && (log.dokumentasi?.length > 0 || log.bukti_kegiatan) && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Dokumentasi Kegiatan</p>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                          {/* Rendering array dokumentasi */}
                          {log.dokumentasi?.map((doc, idx) => (
                            <a key={idx} href={doc.file} target="_blank" rel="noopener noreferrer" className="group relative w-20 h-20 shrink-0 cursor-pointer">
                              <img src={doc.file} alt={doc.keterangan} className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center p-1 transition-opacity">
                                <p className="text-white text-[8px] text-center font-bold leading-tight line-clamp-3">{doc.keterangan}</p>
                              </div>
                            </a>
                          ))}
                          
                          {/* Backward compatibility: jika ada bukti_kegiatan tapi tidak ada array dokumentasi */}
                          {(!log.dokumentasi || log.dokumentasi.length === 0) && log.bukti_kegiatan && log.bukti_kegiatan.startsWith('data:image') && (
                            <a href={log.bukti_kegiatan} target="_blank" rel="noopener noreferrer" className="group relative w-20 h-20 shrink-0 cursor-pointer">
                              <img src={log.bukti_kegiatan} alt="Bukti Kegiatan Lama" className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center p-1 transition-opacity">
                                <p className="text-white text-[8px] text-center font-bold leading-tight line-clamp-3">Bukti Kegiatan Lama</p>
                              </div>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {expandedCpmk[log._id] && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                        {log.matched_indicators && log.matched_indicators.length > 0 ? (
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
                                        {ind.matkul_nama ? <span className="text-indigo-600 mr-1">{ind.matkul_nama} : </span> : null}
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
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
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
                {Math.ceil(filteredLogbooks.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 pt-4">
                    <button 
                      onClick={() => {
                        setCurrentPage(p => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                    >
                      Sebelumnya
                    </button>
                    
                    <div className="flex items-center gap-1 hidden sm:flex">
                      {Array.from({length: Math.ceil(filteredLogbooks.length / itemsPerPage)}, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <div className="sm:hidden text-sm font-bold text-slate-500 dark:text-slate-400 px-2">
                      Hal {currentPage} dari {Math.ceil(filteredLogbooks.length / itemsPerPage)}
                    </div>

                    <button 
                      onClick={() => {
                        setCurrentPage(p => Math.min(Math.ceil(filteredLogbooks.length / itemsPerPage), p + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === Math.ceil(filteredLogbooks.length / itemsPerPage)}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            );
            })()}
          </div>
          
        </div>
      )}
    </DashboardLayout>
  );
}
