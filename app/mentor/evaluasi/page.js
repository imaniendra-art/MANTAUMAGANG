"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";

export default function MentorEvaluasi() {
  const { data: session } = useSession();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluasi/mentor?mentorId=${session.user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 pb-20">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Evaluasi Mentor Instansi</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Berikan penilaian performa magang (rubrik) untuk mahasiswa bimbingan Anda.</p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="font-bold text-sm">{students.length} Mahasiswa</span>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 animate-pulse">
                <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Belum Ada Mahasiswa</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">Tidak ada mahasiswa yang sedang magang atau status pengajuannya belum disetujui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((mhs) => (
              <AccordionItem 
                key={mhs._id} 
                mhs={mhs} 
                onSuccess={() => {
                  showToast("Penilaian berhasil disimpan!");
                  fetchData();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-bold">{toastMessage}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function AccordionItem({ mhs, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data Penilaian Mentor
  const mVal = mhs.penilaian_mentor || {};
  const [kedisiplinan, setKedisiplinan] = useState(mVal.kedisiplinan || "");
  const [tanggungJawab, setTanggungJawab] = useState(mVal.tanggung_jawab || "");
  const [komunikasi, setKomunikasi] = useState(mVal.komunikasi_tim || "");
  const [catatan, setCatatan] = useState(mVal.catatan || "");
  
  const isLocked = mVal.kedisiplinan !== undefined && mVal.kedisiplinan !== null;

  const handleSave = async () => {
    if (kedisiplinan === "" || tanggungJawab === "" || komunikasi === "") {
      alert("Mohon isi semua nilai rubrik (0-100)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/evaluasi/mentor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mhs._id,
          kedisiplinan: parseInt(kedisiplinan),
          tanggung_jawab: parseInt(tanggungJawab),
          komunikasi_tim: parseInt(komunikasi),
          catatan
        })
      });
      if (res.ok) {
        onSuccess();
      } else {
        alert("Gagal menyimpan evaluasi.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-indigo-200 dark:border-indigo-800/50 shadow-md ring-4 ring-indigo-50 dark:ring-indigo-900/20' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
      {/* Header Grid Accordion */}
      <div 
        className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 cursor-pointer items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Kolom 1: Mahasiswa Info */}
        <div className="md:col-span-4 flex flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-xl shrink-0">
            {mhs.mahasiswa_id?.nama_lengkap?.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{mhs.mahasiswa_id?.nama_lengkap}</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{mhs.mahasiswa_id?.nim_nidn}</p>
          </div>
        </div>

        {/* Kolom 2: Lokasi Magang */}
        <div className="md:col-span-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lokasi Magang</span>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">{mhs.detail_tempat?.nama || "-"}</p>
        </div>

        {/* Kolom 3: Status Evaluasi */}
        <div className="md:col-span-3 flex items-center md:justify-end">
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-800/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Sudah Menilai
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-100 dark:border-amber-800/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Belum Menilai
            </span>
          )}
        </div>

        {/* Kolom 4: Action/Arrow */}
        <div className="md:col-span-1 flex items-center justify-end">
          <div className={`p-2 rounded-lg transition-transform duration-300 ${isOpen ? 'rotate-180 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Konten Tersembunyi (Form) */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row gap-8">
          
          {/* Bagian Kiri: Preview Matkul */}
          <div className="md:w-1/2 space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Capaian Nilai Sistem (Preview)
            </h4>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl">
                  {mhs.logbook_count}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logbook Tervalidasi DPL</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ini menentukan Base Score Mata Kuliah</p>
                </div>
              </div>
              <div className="space-y-3">
                {mhs.preview_matkul?.map((mk, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{mk.nama_mk}</p>
                      <p className="text-xs text-slate-500">{mk.kode_mk} • {mk.sks} SKS</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Base Score</p>
                      <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{mk.base_score}</p>
                    </div>
                  </div>
                ))}
                {(!mhs.preview_matkul || mhs.preview_matkul.length === 0) && (
                  <p className="text-sm text-slate-500 italic text-center py-4">Belum ada pemetaan mata kuliah.</p>
                )}
              </div>
            </div>
          </div>

          {/* Bagian Kanan: Form Evaluasi */}
          <div className="md:w-1/2 space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Penilaian Kinerja (Booster)
            </h4>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative">
              
              {isLocked && (
                <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
                  <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="font-black text-slate-800 dark:text-slate-200">Evaluasi Tersimpan</span>
                    <span className="text-xs text-slate-500 mt-1">Nilai sudah dikirim ke DPL.</span>
                  </div>
                </div>
              )}

              <div className="space-y-4 relative z-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kedisiplinan</label>
                    <input 
                      type="number" 
                      min="0" max="100"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold dark:text-slate-100"
                      value={kedisiplinan} 
                      onChange={e => setKedisiplinan(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggung Jawab</label>
                    <input 
                      type="number" 
                      min="0" max="100"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold dark:text-slate-100"
                      value={tanggungJawab} 
                      onChange={e => setTanggungJawab(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Komunikasi Tim</label>
                    <input 
                      type="number" 
                      min="0" max="100"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold dark:text-slate-100"
                      value={komunikasi} 
                      onChange={e => setKomunikasi(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Tambahan (Opsional)</label>
                  <textarea 
                    rows="3"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-sm dark:text-slate-100"
                    placeholder="Berikan masukan singkat tentang performa..."
                    value={catatan}
                    onChange={e => setCatatan(e.target.value)}
                  ></textarea>
                </div>

                <button 
                  onClick={handleSave} 
                  disabled={saving || isLocked}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Menyimpan...
                    </>
                  ) : (
                    "Kunci & Simpan Evaluasi"
                  )}
                </button>
                <p className="text-[11px] text-slate-500 text-center leading-tight px-4">
                  Pastikan nilai sudah benar. Setelah diklik simpan, nilai ini akan langsung menjadi perhitungan *Booster* untuk Mahasiswa di Dasbor DPL.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
