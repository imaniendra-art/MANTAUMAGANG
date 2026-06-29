"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";

export default function DplValidasi() {
  const { data: session } = useSession();
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

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
    <DashboardLayout title="Validasi Akademik (DPL)">
      {toastMessage && (
        <div className="fixed top-24 right-8 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-6 py-3 rounded-xl shadow-lg z-50 animate-in slide-in-from-right-10 fade-in duration-300 font-bold backdrop-blur-sm">
          {toastMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-bold animate-pulse">Memuat antrean logbook...</div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-indigo-500/10">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Antrean Validasi Capaian Pembelajaran</h2>
              <p className="text-sm text-indigo-300/70 mt-1 font-medium">Verifikasi secara akademik apakah kegiatan mahasiswa (yang telah di-ACC Mentor) relevan dengan Indikator CPMK yang diklaim.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold">
                    <th className="py-4 px-6">Mahasiswa & Tgl</th>
                    <th className="py-4 px-6">Indikator CPMK yang Diklaim</th>
                    <th className="py-4 px-6">Deskripsi Kegiatan</th>
                    <th className="py-4 px-6 text-right w-48">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {logbooks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        <div className="text-4xl mb-3">📚</div>
                        Tidak ada logbook menunggu validasi akademik Anda.
                      </td>
                    </tr>
                  ) : (
                    logbooks.map((log) => (
                      <tr key={log._id} className="hover:bg-white dark:bg-slate-800 shadow-sm transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{log.mahasiswa_id?.nama_lengkap}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">{new Date(log.tanggal).toLocaleDateString('id-ID')}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1.5 rounded-lg border border-indigo-500/30 max-w-xs">{log.indikator_id}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">{log.deskripsi_kegiatan}</p>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                          <button 
                            onClick={() => handleValidasi(log._id, 'revisi')}
                            className="px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-bold text-xs rounded-lg transition-colors"
                          >
                            Tolak/Revisi
                          </button>
                          <button 
                            onClick={() => handleValidasi(log._id, 'divalidasi_dpl')}
                            className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs rounded-lg transition-colors shadow-sm"
                          >
                            Validasi CPMK
                          </button>
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
