"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function MentorValidasi() {
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const fetchData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await fetch('/api/logbook?role=mentor');
      const data = await res.json();
      if (Array.isArray(data)) setLogbooks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

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
        showToast(newStatus === 'divalidasi_mentor' ? "Fakta Kegiatan Divalidasi!" : "Diminta revisi!");
        fetchData();
      } else {
        alert("Gagal memvalidasi");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
    }
  };

  return (
    <DashboardLayout title="Validasi Faktual (Mentor)">
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
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Antrean Validasi Mentor</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verifikasi secara faktual apakah deskripsi kegiatan mahasiswa benar-benar dilakukan di instansi Anda.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold">
                    <th className="py-4 px-6">Mahasiswa & Tgl</th>
                    <th className="py-4 px-6">Deskripsi Kegiatan</th>
                    <th className="py-4 px-6">Bukti</th>
                    <th className="py-4 px-6 text-right w-48">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {logbooks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        <div className="text-4xl mb-3">🎉</div>
                        Tidak ada logbook menunggu validasi lapangan Anda.
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
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">{log.deskripsi_kegiatan}</p>
                        </td>
                        <td className="py-4 px-6">
                          {log.bukti_kegiatan ? (
                            <a href={log.bukti_kegiatan} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30">Lihat Bukti</a>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Tidak ada</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                          <button 
                            onClick={() => handleValidasi(log._id, 'revisi')}
                            className="px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-bold text-xs rounded-lg transition-colors"
                          >
                            Minta Revisi
                          </button>
                          <button 
                            onClick={() => handleValidasi(log._id, 'divalidasi_mentor')}
                            className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-600 hover:text-white font-bold text-xs rounded-lg transition-colors border border-emerald-500/30"
                          >
                            Validasi Faktanya
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
