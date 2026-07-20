"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function MentorEvaluasiPublic({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [kedisiplinan, setKedisiplinan] = useState("");
  const [tanggungJawab, setTanggungJawab] = useState("");
  const [komunikasi, setKomunikasi] = useState("");
  const [catatan, setCatatan] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/evaluasi-mentor/${id}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json);
        
        if (json.pengajuan?.penilaian_mentor?.kedisiplinan !== undefined) {
          setKedisiplinan(json.pengajuan.penilaian_mentor.kedisiplinan);
          setTanggungJawab(json.pengajuan.penilaian_mentor.tanggung_jawab);
          setKomunikasi(json.pengajuan.penilaian_mentor.komunikasi_tim);
          setCatatan(json.pengajuan.penilaian_mentor.catatan || "");
          setSaved(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (kedisiplinan === "" || tanggungJawab === "" || komunikasi === "") {
      alert("Mohon isi semua nilai rubrik (0-100)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/evaluasi-mentor/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kedisiplinan: parseInt(kedisiplinan),
          tanggung_jawab: parseInt(tanggungJawab),
          komunikasi_tim: parseInt(komunikasi),
          catatan
        })
      });
      if (res.ok) {
        setSaved(true);
      } else {
        alert("Gagal menyimpan evaluasi.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Tautan Tidak Valid</h1>
          <p className="text-slate-500 text-sm">Tautan evaluasi ini sudah tidak berlaku atau tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const { pengajuan, preview_matkul, logbook_count } = data;
  const mhs = pengajuan.mahasiswa_id;
  const isLocked = saved;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-32 translate-x-32 blur-3xl opacity-50"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <img src="/mm.png" alt="Logo" className="h-12" />
            <div>
              <h1 className="font-black text-xl text-slate-800 tracking-tight">Evaluasi Mentor Instansi</h1>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Program Magang Berdampak (OBE)</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-2xl shrink-0 shadow-inner">
              {mhs?.nama_lengkap?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">{mhs?.nama_lengkap}</h2>
              <p className="text-sm font-semibold text-slate-500">{mhs?.nim_nidn}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                {pengajuan?.detail_tempat?.nama || "Instansi Magang"}
              </div>
            </div>
            <div className="text-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm min-w-[120px]">
              <div className="text-3xl font-black text-indigo-600">{logbook_count}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Logbook Valid</p>
            </div>
          </div>
        </div>

        {/* Matkul Preview */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Capaian Base Score Mata Kuliah
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Nilai dasar (Base Score) yang dihitung secara otomatis oleh sistem berdasarkan logbook yang Anda validasi. Penilaian Anda di bawah ini akan bertindak sebagai <strong>Booster</strong> penambah nilai akhir.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {preview_matkul.map((mk, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-[10px] font-bold text-slate-400">{mk.kode_mk} • {mk.sks} SKS</div>
                  <div className="text-xs font-bold text-slate-700">{mk.nama_mk}</div>
                </div>
                <div className="bg-indigo-100 text-indigo-700 text-sm font-black px-2.5 py-1 rounded-lg">
                  {Math.round(mk.base_score)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Penilaian Form */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative">
          {saved && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 rounded-3xl flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 text-center max-w-sm">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Penilaian Tersimpan!</h3>
                <p className="text-sm text-slate-500 mb-4">Terima kasih, evaluasi Anda telah dikunci ke sistem dan akan diproses dalam Sidang Pleno oleh Dosen Pembimbing Lapangan.</p>
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">Evaluasi Selesai</div>
              </div>
            </div>
          )}

          <div className="mb-6 border-b border-slate-100 pb-6">
            <h3 className="font-bold text-slate-800 text-lg">Rubrik Penilaian Mentor</h3>
            <p className="text-xs text-slate-500 mt-1">Berikan penilaian pada rentang <strong>0 - 100</strong> untuk setiap aspek berikut.</p>
          </div>

          <div className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Kedisiplinan & Etika Kerja</label>
              <p className="text-[10px] text-slate-500 mb-2">Kehadiran, ketepatan waktu, ketaatan pada aturan perusahaan, dan sikap profesional.</p>
              <input type="number" value={kedisiplinan} onChange={e => setKedisiplinan(e.target.value)} disabled={isLocked} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-800 bg-slate-50 disabled:bg-slate-100 transition-all" placeholder="0-100" min="0" max="100"/>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tanggung Jawab & Kinerja</label>
              <p className="text-[10px] text-slate-500 mb-2">Kualitas penyelesaian tugas, inisiatif, dan pencapaian target yang diberikan.</p>
              <input type="number" value={tanggungJawab} onChange={e => setTanggungJawab(e.target.value)} disabled={isLocked} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-800 bg-slate-50 disabled:bg-slate-100 transition-all" placeholder="0-100" min="0" max="100"/>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Komunikasi & Kerja Sama Tim</label>
              <p className="text-[10px] text-slate-500 mb-2">Kemampuan beradaptasi, berkomunikasi efektif, dan kolaborasi dengan rekan kerja.</p>
              <input type="number" value={komunikasi} onChange={e => setKomunikasi(e.target.value)} disabled={isLocked} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-800 bg-slate-50 disabled:bg-slate-100 transition-all" placeholder="0-100" min="0" max="100"/>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
              <textarea value={catatan} onChange={e => setCatatan(e.target.value)} disabled={isLocked} rows="3" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-sm text-slate-800 bg-slate-50 disabled:bg-slate-100 transition-all resize-none" placeholder="Masukkan masukan atau pesan untuk mahasiswa..."></textarea>
            </div>

            {!isLocked && (
              <div className="pt-4">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <span>Simpan & Kunci Evaluasi Final</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-slate-400 mt-3">Nilai yang telah disimpan tidak dapat diubah kembali.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
