"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

import { Suspense } from "react";

function MahasiswaDashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [analisis, setAnalisis] = useState(null);
  const [pengajuan, setPengajuan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPengajuan, setLoadingPengajuan] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Cek parameter success untuk notifikasi pengajuan
    if (searchParams.get('success') === 'true') {
      const timer1 = setTimeout(() => {
        setShowToast(true);
      }, 0);
      
      // Bersihkan URL tanpa merefresh halaman
      window.history.replaceState(null, '', '/mahasiswa');
      
      // Auto-hide toast setelah 5 detik
      const timer2 = setTimeout(() => setShowToast(false), 5000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [searchParams]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/logbook/analisis?mhsId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setAnalisis(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });

      fetch(`/api/pengajuan?mhsId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setPengajuan(data);
          }
          setLoadingPengajuan(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingPengajuan(false);
        });
    }
  }, [session]);

  const dplValidatedLog = analisis?.recent_logs?.find(l => l.status_validasi === 'divalidasi_dpl');

  // Alert Card Berdasarkan Status Pengajuan
  const renderStatusAlert = () => {
    if (loadingPengajuan) return (
      <div className="h-32 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none rounded-2xl animate-pulse border border-slate-300 dark:border-slate-600" />
    );

    if (!pengajuan) {
      return (
        <div className="h-full min-h-[8rem] relative bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-700 border-l-8 border-l-slate-400 shadow-sm dark:shadow-none flex items-start gap-3 transition-all hover:shadow-md">
          <Clock className="w-8 h-8 text-slate-400 shrink-0 mt-0.5" />
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">Belum Ada Pengajuan</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              Anda belum mengajukan magang. Silakan cari posisi di Katalog.
            </p>
          </div>
        </div>
      );
    }

    const status = pengajuan.status_pengajuan;
    if (status === 'menunggu') {
      return (
        <div className="h-full min-h-[8rem] relative bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-700 border-l-8 border-l-amber-500 shadow-sm dark:shadow-none flex items-start gap-3 transition-all hover:shadow-md">
          <Clock className="w-8 h-8 text-amber-500 shrink-0 mt-0.5" />
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">Menunggu Verifikasi</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              ⏳ Pengajuan Anda sedang diverifikasi oleh Admin. Harap bersabar.
            </p>
          </div>
        </div>
      );
    }

    if (status === 'disetujui') {
      const namaDpl = pengajuan.dpl_id?.nama_lengkap || "Belum Ditugaskan";
      const waNumber = pengajuan.dpl_id?.nomor_hp;
      const lokasiMagang = pengajuan.posisi_id?.mitra_id?.nama_instansi || pengajuan.mitra_id?.nama_instansi || pengajuan.detail_tempat?.nama || "lokasi magang";
      
      const isConfirmed = pengajuan.is_dpl_confirmed;

      const waLink = waNumber 
        ? `https://wa.me/${waNumber.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo Bapak/Ibu ${namaDpl}, saya ${session?.user?.name || 'Mahasiswa'} mahasiswa bimbingan magang Bapak/Ibu. Mohon arahannya untuk proses koordinasi Magang Mandiri pada ${lokasiMagang}.`)}`
        : null;

      return (
        <div className="h-full min-h-[8rem] relative bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-700 border-l-8 border-l-emerald-500 shadow-sm dark:shadow-none flex items-start gap-4 transition-all hover:shadow-md">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0 mt-1" />
          <div className="flex-1 overflow-hidden">
            <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">
              {isConfirmed ? "Penyerahan Selesai" : "Pengajuan Diterima"}
            </h4>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              🎉 Selamat! Anda diterima. DPL Anda: <strong>{namaDpl}</strong>.
            </p>
            {isConfirmed ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-4 leading-relaxed bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                ✅ DPL telah mengonfirmasi penyerahan Anda. Silakan mulai magang dan jangan lupa mengisi logbook harian!
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Segera hubungi Dosen Pembimbing Lapangan (DPL) Anda untuk koordinasi Magang Mandiri pada <strong>{lokasiMagang}</strong>.
              </p>
            )}
            
            {!isConfirmed && waLink && (
              <a 
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl transition-colors shadow-sm dark:shadow-none"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Hubungi DPL via WhatsApp
              </a>
            )}
          </div>
        </div>
      );
    }

    if (status === 'ditolak') {
      const alasanRaw = pengajuan.alasan_penolakan || "Silakan ajukan posisi magang yang lain.";
      const hasDitolak = alasanRaw.toLowerCase().includes('ditolak');
      const deskripsiText = hasDitolak ? alasanRaw : `Alasan penolakan: ${alasanRaw}`;

      return (
        <div className="h-full min-h-[8rem] relative bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-700 border-l-8 border-l-rose-500 shadow-sm dark:shadow-none flex items-start gap-3 transition-all hover:shadow-md">
          <XCircle className="w-8 h-8 text-rose-500 shrink-0 mt-0.5" />
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">Pengajuan Ditolak</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              ❌ {deskripsiText}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  // Notification cards untuk slot notifications di DashboardLayout
  const notificationCards = (loading || loadingPengajuan) ? (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <div className="h-full min-h-[8rem] bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none rounded-2xl animate-pulse border border-slate-300 dark:border-slate-600" />
      <div className="h-full min-h-[8rem] bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none rounded-2xl animate-pulse border border-slate-300 dark:border-slate-600" />
      <div className="h-full min-h-[8rem] bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none rounded-2xl animate-pulse border border-slate-300 dark:border-slate-600" />
    </div>
  ) : (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {/* Kolom 1: Status Pengajuan */}
      {renderStatusAlert()}

      {/* Kolom 2: Achievement / Poin Card */}
      {dplValidatedLog ? (
        <div className="h-full min-h-[8rem] relative bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 p-5 rounded-2xl border border-amber-400/20 overflow-hidden flex flex-col justify-center transition-all hover:shadow-md">
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.06] pointer-events-none">🏆</div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-xl shadow-lg shadow-orange-500/20 shrink-0">
              🏅
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Achievement Terkunci!</h3>
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">+ {dplValidatedLog.nilai_otomatis} Poin Kinerja</p>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed relative z-10 mt-2 line-clamp-2">
            🎉 Kegiatan <span className="font-bold text-slate-800 dark:text-slate-100">&quot;{dplValidatedLog.deskripsi_kegiatan}&quot;</span> telah memenuhi CPMK.
          </p>
        </div>
      ) : (
        <div className="h-full min-h-[8rem] bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center text-center transition-all hover:shadow-md">
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Belum Ada Poin</h3>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">Dapatkan validasi DPL pada logbook harianmu!</p>
        </div>
      )}

      {/* Kolom 3: Monoton Alert / Variasi Baik */}
      {analisis?.peringatan_monoton ? (
        <div className="h-full min-h-[8rem] relative bg-gradient-to-br from-red-500/10 to-red-500/5 p-5 rounded-2xl border border-red-400/20 overflow-hidden flex flex-col justify-center transition-all hover:shadow-md">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl border border-red-500/20 shrink-0">
              ⚠️
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-300">Awas Monoton!</h3>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">3 Hari Berturut-turut</p>
            </div>
          </div>
          <p className="text-red-200/80 text-xs font-medium leading-relaxed mt-2 line-clamp-2">
            Kamu melakukan kegiatan yang sama. Diskusikan dengan Mentor untuk tanggung jawab baru!
          </p>
        </div>
      ) : (
        <div className="h-full min-h-[8rem] bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
              🌟
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Variasi Kegiatan Baik</h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Magang cukup bervariasi.</p>
            </div>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-full h-2 mb-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full w-full relative">
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 text-right">Aman & Terkendali</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {showToast && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-10 fade-in duration-500">
          <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl border-l-4 border-emerald-500 shadow-2xl rounded-xl p-4 pr-6 flex items-start gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2 rounded-full shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-emerald-700 dark:text-emerald-400 font-bold text-sm mb-0.5">Pengajuan Berhasil Dikirim!</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-[250px]">
                Silakan menunggu konfirmasi dan plotting DPL dari Admin Pusdatin.
              </p>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <DashboardLayout title="Dashboard Prestasi" notifications={notificationCards}>
        {/* Children kosong untuk dashboard utama — semua konten ada di hero + notif + menu cards */}
      </DashboardLayout>
    </>
  );
}

export default function MahasiswaDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">Memuat Dashboard...</div>}>
      <MahasiswaDashboardContent />
    </Suspense>
  );
}
