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

  const handleSaveEvaluasi = async (id, sistematika, kualitas, penguasaan, catatan) => {
    if (sistematika < 0 || sistematika > 100 || kualitas < 0 || kualitas > 100 || penguasaan < 0 || penguasaan > 100) {
      alert("Semua nilai harus antara 0 - 100");
      return;
    }
    
    try {
      const res = await fetch('/api/evaluasi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          sistematika_laporan: sistematika,
          kualitas_isi: kualitas,
          penguasaan_materi: penguasaan,
          catatan
        })
      });
      if (res.ok) {
        showToast("Penilaian DPL Berhasil Disimpan & Transkrip Terkunci!");
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
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Penilaian Akademik Mahasiswa</h2>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed font-medium">
              Berikan penilaian akademik bagi mahasiswa Anda. Anda dapat <strong>menyalin Link Ajaib</strong> dan mengirimkannya ke Mentor via WhatsApp untuk mempermudah Mentor menilai tanpa perlu login. Setelah Anda dan Mentor menilai, tekan "Kunci".
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-[#0F172A]/5 dark:bg-slate-800/20 backdrop-blur-sm rounded-3xl animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="bg-[#0F172A]/5 dark:bg-slate-800/20 backdrop-blur-xl shadow-sm p-16 rounded-3xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-6xl mb-4 opacity-80">🏆</div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Belum Ada Mahasiswa</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Tidak ada mahasiswa bimbingan yang siap dievaluasi saat ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map(mhs => (
            <StudentAccordionCard key={mhs._id} mhs={mhs} onSave={handleSaveEvaluasi} showToast={showToast} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function StudentAccordionCard({ mhs, onSave, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const dplVal = mhs.penilaian_dpl || {};
  const [sistematika, setSistematika] = useState(dplVal.sistematika_laporan || "");
  const [kualitas, setKualitas] = useState(dplVal.kualitas_isi || "");
  const [penguasaan, setPenguasaan] = useState(dplVal.penguasaan_materi || "");
  const [catatan, setCatatan] = useState(dplVal.catatan || "");
  
  const isLocked = dplVal.sistematika_laporan !== undefined && dplVal.sistematika_laporan !== null;
  const isMentorRated = mhs.penilaian_mentor && mhs.penilaian_mentor.kedisiplinan != null;

  const copyMagicLink = (e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/evaluasi-mentor/${mhs._id}`;
    navigator.clipboard.writeText(link);
    showToast("Link Ajaib disalin ke clipboard!");
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-sm border ${isOpen ? 'border-rose-200 dark:border-rose-900/50' : 'border-slate-200 dark:border-slate-700'} overflow-hidden transition-all duration-300`}>
      {/* Accordion Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-6 cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-6 items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
      >
        {/* Mahasiswa Info - Col Span 3 */}
        <div className="md:col-span-3 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
            {mhs.mahasiswa_id?.nama_lengkap.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{mhs.mahasiswa_id?.nama_lengkap}</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{mhs.mahasiswa_id?.nim_nidn}</p>
            {isLocked && (
              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded">
                Selesai
              </span>
            )}
          </div>
        </div>

        {/* Lokasi - Col Span 2 */}
        <div className="md:col-span-2 hidden md:block">
           <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Lokasi Magang</p>
           <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">
             {mhs.detail_tempat?.nama || "Instansi"}
           </div>
        </div>

        {/* Mentor Info - Col Span 2 */}
        <div className="md:col-span-2 hidden xl:block">
           <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mentor Instansi</p>
           <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
             {mhs.mentor_id?.nama_lengkap || "Anonim"}
           </div>
           <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
             {mhs.mentor_id?.nomor_hp || "No HP"}
           </div>
        </div>

        {/* Mentor Status - Col Span 2 */}
        <div className="md:col-span-2 hidden md:block">
           <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status Mentor</p>
            {isMentorRated ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Sudah Menilai
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Belum Menilai
              </div>
            )}
        </div>

        {/* Status DPL - Col Span 2 */}
        <div className="md:col-span-2">
           <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status Penilaian DPL</p>
            {isLocked ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Selesai
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Belum Selesai
              </div>
            )}
        </div>

        {/* Actions - Col Span 1 */}
        <div className="md:col-span-1 flex items-center justify-end gap-3">
            {!isLocked && (
              <button 
                onClick={copyMagicLink}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold transition-colors border border-indigo-200 dark:border-indigo-800/50"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span className="whitespace-nowrap">Link Mentor</span>
              </button>
            )}
            <div className={`p-2 shrink-0 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-100 dark:bg-slate-700' : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20">
          
          {!isLocked && (
            <div className="md:hidden mb-6">
              <button 
                onClick={copyMagicLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold border border-indigo-200 dark:border-indigo-800/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Salin Link Penilaian Mentor
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-2">Kirim link ini ke mentor via WhatsApp agar mereka bisa menilai tanpa login.</p>
            </div>
          )}

          {!isMentorRated && !isLocked && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-xl">
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Mentor Belum Menilai
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Jika Anda mengunci evaluasi sekarang, nilai <i>booster</i> dari mentor akan dihitung 0. Harap pastikan mentor sudah mengisi melalui Link Ajaib.</p>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Kiri: Preview Matkul & Logbook */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{mhs.computed_rekomendasi}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Rekomendasi</div>
                </div>
                <div className="text-center border-l border-slate-200 dark:border-slate-700 pl-4">
                  <div className="text-4xl font-black text-slate-700 dark:text-slate-300">{mhs.logbook_count}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Logbook</div>
                </div>
              </div>
              
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Preview Base Score Matkul</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {mhs.preview_matkul?.map((mk, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="text-[9px] font-bold text-slate-400">{mk.kode_mk} • {mk.sks} SKS</div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{mk.nama_mk}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-black px-2 py-1 rounded">
                      {Math.round(mk.base_score)}
                    </div>
                  </div>
                ))}
                {(!mhs.preview_matkul || mhs.preview_matkul.length === 0) && (
                  <div className="text-xs text-slate-500 italic">Tidak ada data paket matkul.</div>
                )}
              </div>
            </div>

            {/* Kanan: Form Penilaian DPL */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Form Penilaian DPL</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sistematika Laporan</label>
                    <input type="number" value={sistematika} onChange={e => setSistematika(e.target.value)} disabled={isLocked} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:ring-2 focus:ring-rose-500" placeholder="0-100" min="0" max="100"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kualitas Isi</label>
                    <input type="number" value={kualitas} onChange={e => setKualitas(e.target.value)} disabled={isLocked} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:ring-2 focus:ring-rose-500" placeholder="0-100" min="0" max="100"/>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Penguasaan Materi (Bimbingan)</label>
                  <input type="number" value={penguasaan} onChange={e => setPenguasaan(e.target.value)} disabled={isLocked} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:ring-2 focus:ring-rose-500" placeholder="0-100" min="0" max="100"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan Akademik</label>
                  <textarea 
                    value={catatan} 
                    onChange={(e) => setCatatan(e.target.value)} 
                    disabled={isLocked}
                    rows="2" 
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:ring-2 focus:ring-rose-500 resize-none" 
                    placeholder={isLocked ? "-" : "Tuliskan catatan akademik..."}
                  ></textarea>
                </div>
                
                <div className="pt-2 flex justify-end">
                  {isLocked ? (
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wide border border-emerald-500/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Transkrip Terkunci
                    </div>
                  ) : (
                    <button 
                      onClick={() => onSave(mhs._id, parseInt(sistematika), parseInt(kualitas), parseInt(penguasaan), catatan)}
                      disabled={!isMentorRated}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs rounded-lg shadow-md shadow-rose-500/20 transition-all ${!isMentorRated ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:from-pink-600 hover:to-rose-700 transform hover:-translate-y-0.5'}`}
                    >
                      <span>{isMentorRated ? "Simpan & Kunci Transkrip" : "Tunggu Mentor Menilai"}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
