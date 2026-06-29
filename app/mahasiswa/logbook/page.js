"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";

export default function LogbookPage() {
  const { data: session } = useSession();
  
  const [pengajuan, setPengajuan] = useState(null);
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [tanggal, setTanggal] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [indikator, setIndikator] = useState("");
  const [bukti, setBukti] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pengajuan || pengajuan.status_pengajuan !== 'disetujui') return;
    setSubmitting(true);

    try {
      const payload = {
        pengajuan_id: pengajuan._id,
        mahasiswa_id: session.user.id,
        tanggal,
        deskripsi_kegiatan: deskripsi,
        indikator_id: indikator,
        bukti_kegiatan: bukti
      };

      const res = await fetch('/api/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("Logbook Berhasil Disimpan!");
        setTanggal("");
        setDeskripsi("");
        setIndikator("");
        setBukti("");
        fetchData();
      } else {
        const err = await res.json();
        alert("Gagal: " + err.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan server.");
    } finally {
      setSubmitting(false);
    }
  };

  let cpmkList = [];
  if (pengajuan?.paket_matkul_id?.mata_kuliah) {
    cpmkList = pengajuan.paket_matkul_id.mata_kuliah.flatMap(mk => 
      (mk.cpmk || []).flatMap(c => 
        (c.indikator || []).map(ind => ({ matkul: mk.nama, indikator: ind }))
      )
    );
  }

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

  return (
    <DashboardLayout title="Logbook Harian (OBE)">
      {toastMessage && (
        <div className="fixed top-24 right-8 bg-green-500 text-slate-800 dark:text-slate-100 px-6 py-3 rounded-xl shadow-lg shadow-green-500/30 z-50 animate-in slide-in-from-right-10 fade-in duration-300 font-bold">
          {toastMessage}
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
          
          {/* KIRI: Form Pengisian */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden sticky top-28">
              <div className="p-6 border-b border-slate-100 bg-indigo-50/30">
                <h3 className="text-lg font-bold text-slate-900">Tulis Logbook Baru</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Isi berdasarkan aktivitas rill di {pengajuan.detail_tempat?.nama}.</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Kegiatan</label>
                  <input required value={tanggal} onChange={(e) => setTanggal(e.target.value)} type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Indikator CPMK</label>
                  <select required value={indikator} onChange={(e) => setIndikator(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium text-sm">
                    <option value="" disabled>-- Pilih Kompetensi yang Dicapai --</option>
                    {cpmkList.map((c, i) => (
                      <option key={i} value={`${c.matkul}: ${c.indikator}`}>[{c.matkul}] - {c.indikator}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Kegiatan</label>
                  <textarea required value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows="3" placeholder="Jelaskan apa yang Anda kerjakan hari ini..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 text-sm"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Link Bukti / Eviden (Opsional)</label>
                  <input value={bukti} onChange={(e) => setBukti(e.target.value)} type="url" placeholder="Link Google Drive / Dokumen" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 font-medium text-sm" />
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Logbook'}
                </button>
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
                {logbooks.map(log => (
                  <div key={log._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          {new Date(log.tanggal).getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', month: 'short', year: 'numeric' })}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Disubmit pada {new Date(log.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      {getStatusBadge(log.status_validasi)}
                    </div>
                    
                    <p className="text-slate-700 text-sm mt-4 leading-relaxed">{log.deskripsi_kegiatan}</p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <div className="flex gap-2 items-start">
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded shrink-0">CPMK</span>
                        <p className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded w-max">{log.indikator_id}</p>
                      </div>
                      {log.bukti_kegiatan && (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">Bukti</span>
                          <a href={log.bukti_kegiatan} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline truncate max-w-xs">{log.bukti_kegiatan}</a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}
    </DashboardLayout>
  );
}
