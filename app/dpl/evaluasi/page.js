"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";

export default function DplEvaluasi() {
  const { data: session } = useSession();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluasi?dplId=${session.user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setStudents(data);
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

  const handleSaveEvaluasi = async (id, rekSistem, mutlak, catatan) => {
    if (!mutlak || mutlak < 0 || mutlak > 100) {
      alert("Nilai mutlak harus antara 0 - 100");
      return;
    }
    
    try {
      const res = await fetch('/api/evaluasi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          nilai_rekomendasi_sistem: rekSistem,
          nilai_akhir_mutlak: mutlak,
          catatan_evaluasi: catatan
        })
      });
      if (res.ok) {
        showToast("Nilai Akhir Berhasil Dikunci!");
        fetchData();
      } else {
        alert("Gagal menyimpan evaluasi");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
    }
  };

  return (
    <DashboardLayout title="Evaluasi & Keputusan Pleno">
      {toastMessage && (
        <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl border-l-4 border-emerald-500 shadow-2xl rounded-xl p-4 flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-8 shadow-xl mb-8 border border-slate-700">
        <div className="absolute -right-10 -bottom-10 text-9xl opacity-5 pointer-events-none">🎓</div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30 flex items-center justify-center text-3xl shrink-0">
            📊
          </div>
          <div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Penilaian Akhir Mahasiswa</h2>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed font-medium">
              Tentukan Nilai Akhir Mutlak bagi mahasiswa bimbingan Anda. <span className="text-pink-300 font-bold">Nilai Rekomendasi Sistem</span> dihasilkan secara otomatis dari rata-rata validasi logbook harian, namun Anda memiliki hak penuh untuk menguncinya berdasarkan pleno dengan Mentor Instansi.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {[1,2].map(i => (
            <div key={i} className="h-64 bg-[#0F172A]/5 dark:bg-slate-800/20 backdrop-blur-sm rounded-3xl animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="bg-[#0F172A]/5 dark:bg-slate-800/20 backdrop-blur-xl shadow-sm p-16 rounded-3xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-6xl mb-4 opacity-80">🏆</div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Belum Ada Mahasiswa</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Tidak ada mahasiswa bimbingan yang siap dievaluasi saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {students.map(mhs => (
            <StudentEvaluasiCard key={mhs._id} mhs={mhs} onSave={handleSaveEvaluasi} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function StudentEvaluasiCard({ mhs, onSave }) {
  const [nilaiMutlak, setNilaiMutlak] = useState(mhs.nilai_akhir_mutlak || "");
  const [catatan, setCatatan] = useState(mhs.catatan_evaluasi || "");
  const isLocked = mhs.nilai_akhir_mutlak !== undefined && mhs.nilai_akhir_mutlak !== null;

  return (
    <div className={`backdrop-blur-xl shadow-sm rounded-3xl border overflow-hidden flex flex-col relative transition-all duration-300 ${isLocked ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md'}`}>
      
      {isLocked && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-bl-2xl z-10 flex items-center gap-1.5 shadow-sm">
          <span>🔒 Nilai Terkunci</span>
        </div>
      )}
      
      {/* Card Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-start gap-4 relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black text-2xl shrink-0 shadow-inner border border-slate-200/50 dark:border-slate-700">
          {mhs.mahasiswa_id?.nama_lengkap.charAt(0)}
        </div>
        <div className="z-10">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight mb-0.5">{mhs.mahasiswa_id?.nama_lengkap}</h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{mhs.mahasiswa_id?.nim_nidn}</p>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full w-max border border-slate-200 dark:border-slate-700">
            {mhs.detail_tempat?.nama}
          </div>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col sm:flex-row gap-6">
        
        {/* Kolom Kiri: Rekomendasi */}
        <div className="sm:w-1/3 flex flex-col">
          <div className="bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-5 text-center flex-1 flex flex-col justify-center items-center shadow-inner">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1 rounded-full mb-3 shadow-sm border border-blue-100 dark:border-blue-800/50">Rekomendasi</span>
            <div className="text-6xl font-black text-blue-600 dark:text-blue-400 mb-1 drop-shadow-sm">{mhs.computed_rekomendasi}</div>
            <p className="text-[10px] font-bold text-blue-500/70 dark:text-blue-300/50 uppercase tracking-wider mt-2">Dari {mhs.logbook_count} Logbook</p>
          </div>
        </div>
        
        {/* Kolom Kanan: Form Input */}
        <div className="sm:w-2/3 flex flex-col justify-center">
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Nilai Akhir Mutlak (Pleno)</label>
            <div className="relative">
              <input 
                type="number" 
                value={nilaiMutlak} 
                onChange={(e) => setNilaiMutlak(e.target.value)} 
                disabled={isLocked}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-slate-50 dark:bg-slate-900/50 font-black text-2xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 disabled:bg-transparent disabled:text-slate-500 disabled:border-transparent disabled:px-0 transition-all" 
                placeholder="0" 
                min="0" max="100"
              />
              {!isLocked && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">/ 100</span>}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Catatan Evaluasi (Opsional)</label>
            <textarea 
              value={catatan} 
              onChange={(e) => setCatatan(e.target.value)} 
              disabled={isLocked}
              rows="2" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-slate-50 dark:bg-slate-900/50 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 disabled:bg-transparent disabled:text-slate-500 disabled:border-transparent disabled:px-0 transition-all resize-none" 
              placeholder={isLocked ? "-" : "Tuliskan kelebihan, kekurangan, atau evaluasi akhir..."}
            ></textarea>
          </div>
        </div>
      </div>
      
      {/* Card Footer */}
      {!isLocked && (
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center">
          <button 
            onClick={() => onSave(mhs._id, mhs.computed_rekomendasi, parseInt(nilaiMutlak), catatan)}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 transform hover:scale-[1.02]"
          >
            <span>Kunci Nilai Akhir</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
