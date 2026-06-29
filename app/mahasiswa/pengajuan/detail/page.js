"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function DetailContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const mitraId = searchParams.get('mitra_id');
  const posisiId = searchParams.get('posisi_id');

  const [posisi, setPosisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [fileCv, setFileCv] = useState(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!mitraId || !posisiId) {
      router.push('/mahasiswa/pengajuan');
      return;
    }

    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/posisi?posisiId=${posisiId}`);
        if (res.ok) {
          const data = await res.json();
          setPosisi(data);
        } else {
          router.push('/mahasiswa/pengajuan');
        }
      } catch (error) {
        console.error("Gagal memuat detail posisi", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [mitraId, posisiId, router]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");
    setFileCv(null);

    if (file) {
      if (file.type !== "application/pdf") {
        setFileError("Format dokumen wajib PDF.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
        setFileError("Ukuran maksimal file adalah 2MB.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFileCv(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.user?.id) return alert("Sesi tidak ditemukan. Silakan login ulang.");
    if (!fileCv) return setFileError("Silakan unggah CV Anda terlebih dahulu.");
    if (posisi?.kuota <= 0) return alert("Mohon maaf, kuota untuk posisi ini sudah penuh.");

    setSubmitting(true);

    const formData = new FormData();
    formData.append('mahasiswa_id', session.user.id);
    formData.append('mitra_id', mitraId);
    formData.append('posisi_id', posisiId);
    formData.append('mitra_nama', posisi?.mitra_id?.nama_instansi || '');
    formData.append('mitra_alamat', posisi?.mitra_id?.alamat || '');
    formData.append('posisi_nama', posisi?.nama_posisi || '');
    formData.append('file_cv', fileCv);

    try {
      const res = await fetch('/api/mahasiswa/pengajuan', {
        method: 'POST',
        body: formData
      });
      
      const resData = await res.json();

      if (res.ok) {
        // Hapus memori target_magang jika ada
        localStorage.removeItem('target_magang');
        alert("Pendaftaran Berhasil! Pengajuan magang Anda sedang direview.");
        // Redirect ke dashboard mahasiswa
        router.push('/mahasiswa');
      } else {
        alert("Gagal: " + resData.error);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem saat mengirim pengajuan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Detail Posisi Magang">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 rounded-full animate-spin border-blue-500/30 border-t-blue-500" />
            <div className="text-slate-500 font-bold animate-pulse">Memuat Detail Posisi...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!posisi) return null;

  const isFull = posisi.kuota <= 0;

  return (
    <DashboardLayout title="Detail Posisi Magang">
      <div className="container mx-auto px-4 max-w-7xl space-y-6 mb-10">
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* KOLOM KIRI: Informasi Utama */}
          <div className="flex-1 space-y-6">
            
            {/* Header Info Card */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-4">
                Informasi Mitra
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                {posisi.mitra_id?.nama_instansi}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2 mb-6">
                <span className="shrink-0 mt-0.5">📍</span> {posisi.mitra_id?.alamat || "Alamat tidak tersedia"}
              </p>

              <hr className="border-slate-100 dark:border-slate-700 mb-6" />

              <div className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                Detail Posisi
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                {posisi.nama_posisi}
              </h2>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-lg">🎯</div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Konsentrasi</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{posisi.konsentrasi}</p>
                  </div>
                </div>
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-lg">👥</div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Status Kuota</p>
                    <p className={`text-sm font-bold ${isFull ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isFull ? 'Penuh / Ditutup' : `${posisi.kuota} Orang Tersedia`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deskripsi & Persyaratan */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Deskripsi Pekerjaan</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  {posisi.deskripsi || "Tidak ada deskripsi spesifik yang diberikan untuk posisi ini. Silakan hubungi koordinator magang untuk informasi lebih lanjut."}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Kualifikasi Umum</h3>
                <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
                  <li>Mahasiswa aktif minimal semester 5.</li>
                  <li>Sesuai dengan konsentrasi {posisi.konsentrasi}.</li>
                  <li>Berkomitmen mengikuti program magang secara penuh waktu (full-time).</li>
                  <li>Memiliki kemampuan komunikasi dan adaptasi yang baik.</li>
                </ul>
              </div>
            </div>

          </div>

          {/* KOLOM KANAN: Action Panel */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl sticky top-8">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Form Pendaftaran</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Silakan unggah Curriculum Vitae (CV) Anda untuk melamar posisi ini.
              </p>

              {isFull ? (
                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-800 text-center">
                  <div className="text-4xl mb-3">🚫</div>
                  <h3 className="text-red-700 dark:text-red-400 font-bold mb-1">Kuota Penuh</h3>
                  <p className="text-red-500/80 dark:text-red-400/80 text-xs font-medium">Pendaftaran untuk posisi ini sudah ditutup sementara.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* File Upload UI */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 text-center transition-all hover:bg-slate-100 dark:hover:bg-slate-900 relative">
                    <div className="text-3xl mb-3">📄</div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Unggah File CV</label>
                    <p className="text-xs text-slate-500 mb-4">Format PDF, maksimal 2MB.</p>
                    
                    <input 
                      type="file" 
                      accept=".pdf,application/pdf"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    <div className="inline-flex px-4 py-2 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                      Pilih File
                    </div>
                  </div>

                  {fileError && <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">⚠️ {fileError}</p>}
                  {fileCv && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                      <div className="text-xl">✅</div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">{fileCv.name}</p>
                        <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 mt-0.5">{(fileCv.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button 
                      type="submit" 
                      disabled={submitting || !fileCv}
                      className="w-full py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_10px_25px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {submitting ? 'Mengirim Lamaran...' : 'Kirim Lamaran Sekarang'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default function DetailPengajuanPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 rounded-full animate-spin border-blue-500/30 border-t-blue-500" />
          <div className="text-slate-500 font-bold animate-pulse">Menyiapkan Halaman...</div>
        </div>
      </div>
    }>
      <DetailContent />
    </Suspense>
  );
}
