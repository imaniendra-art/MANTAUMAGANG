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
  const [absensiToday, setAbsensiToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPengajuan, setLoadingPengajuan] = useState(true);
  
  const [aiTip, setAiTip] = useState(null);
  const [loadingTip, setLoadingTip] = useState(false);
  const [loadingAbsensi, setLoadingAbsensi] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [showAbsensiModal, setShowAbsensiModal] = useState(false);

  // Form Absensi State
  const [absensiStatus, setAbsensiStatus] = useState("hadir");
  const [rencanaKegiatan, setRencanaKegiatan] = useState("");
  const [alasan, setAlasan] = useState("");
  const [fotoBukti, setFotoBukti] = useState("");
  const [submittingAbsensi, setSubmittingAbsensi] = useState(false);

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

  const fetchDashboardData = () => {
    if (session?.user?.id) {
      // Get Today's Date YYYY-MM-DD local time
      const today = new Date();
      const tzOffset = today.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(today - tzOffset)).toISOString().split('T')[0];

      fetch(`/api/absensi?mhsId=${session.user.id}&tanggal=${localISOTime}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setAbsensiToday(data[0]);
          } else {
            setAbsensiToday(null);
          }
          setLoadingAbsensi(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingAbsensi(false);
        });

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
  };

  useEffect(() => {
    fetchDashboardData();
  }, [session]);

  // Efek untuk memuat atau meng-generate Tip AI
  useEffect(() => {
    if (analisis?.achievements) {
      const unachieved = analisis.achievements.filter(a => a.status !== 'tercapai');
      if (unachieved.length > 0) {
        const todayDateObj = new Date();
        const localISOTime = new Date(todayDateObj.getTime() - todayDateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const index = todayDateObj.getDate() % unachieved.length;
        const suggestedCpmk = unachieved[index].nama_cpmk;
        
        const cacheKey = `ai_tip_${localISOTime}_${suggestedCpmk}`;
        const cachedTip = localStorage.getItem(cacheKey);
        
        if (cachedTip) {
          setAiTip(cachedTip);
        } else {
          setLoadingTip(true);
          fetch('/api/ai/daily-tip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpmk_name: suggestedCpmk })
          })
          .then(res => res.json())
          .then(data => {
            if (data.tip) {
              const finalTip = `Yuk jadilah proaktif! Diskusikan dengan mentormu hari ini, ajukan inisiatif atau tanyakan kegiatan apa yang bisa kamu kerjakan. Sebagai saran, <strong>${data.tip}</strong> Mentor pasti akan sangat mengapresiasi semangatmu!`;
              localStorage.setItem(cacheKey, finalTip);
              setAiTip(finalTip);
            }
            setLoadingTip(false);
          })
          .catch(err => {
            console.error(err);
            setLoadingTip(false);
          });
        }
      } else {
        // Jika sudah tercapai semua
        setAiTip("Luar biasa! Semua target CPMK-mu sudah tercapai. Terus pertahankan performamu dan jadilah proaktif membantu proyek-proyek penting di tempat magang. Mentor pasti akan sangat mengapresiasi semangatmu!");
      }
    }
  }, [analisis]);

  const handleFileAbsensiChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto maksimal 2MB");
        e.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBukti(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFotoBukti("");
    }
  };

  const handleSubmitAbsensi = async (e) => {
    e.preventDefault();
    if (!pengajuan || pengajuan.status_pengajuan !== 'disetujui') return;

    if (absensiStatus !== 'hadir' && !fotoBukti) {
      alert("Wajib mengunggah foto bukti (surat dokter/keterangan) jika Izin atau Sakit.");
      return;
    }

    setSubmittingAbsensi(true);
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today - tzOffset)).toISOString().split('T')[0];

    const payload = {
      mahasiswa_id: session.user.id,
      pengajuan_id: pengajuan._id,
      tanggal: localISOTime,
      status: absensiStatus,
      rencana_kegiatan: absensiStatus === 'hadir' ? rencanaKegiatan : "",
      alasan: absensiStatus !== 'hadir' ? alasan : "",
      foto_bukti: absensiStatus !== 'hadir' ? fotoBukti : ""
    };

    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Absensi berhasil disimpan! Selamat beraktivitas.");
        setShowAbsensiModal(false);
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert("Gagal: " + err.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setSubmittingAbsensi(false);
    }
  };

  const dplValidatedLog = analisis?.recent_logs?.find(l => l.status_validasi === 'divalidasi_dpl');

  let sisaHari = null;
  let isExpired = false;
  if (pengajuan && pengajuan.status_pengajuan === 'disetujui' && pengajuan.is_dpl_confirmed && pengajuan.tanggal_selesai) {
    const endDate = new Date(pengajuan.tanggal_selesai);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (sisaHari < 0) {
      isExpired = true;
      sisaHari = 0;
    }
  }

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
        <div className="h-full min-h-[8rem] relative bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-5 rounded-2xl border border-emerald-400/20 flex flex-col transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                {isConfirmed ? "Penyerahan Selesai" : "Pengajuan Diterima"}
              </h3>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Status Pengajuan Magang</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl shrink-0">
              {isConfirmed ? '✅' : '🎉'}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <div className="bg-white/50 dark:bg-black/20 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/10">
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                🎉 Selamat! Anda diterima. DPL Anda: <strong>{namaDpl}</strong>.
              </p>
            </div>
            
            {isConfirmed ? (
              <div className="space-y-2 mt-auto">
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                  ✅ DPL telah mengonfirmasi penyerahan Anda. Silakan mengisi logbook harian!
                </p>
                {analisis?.achieved_today && (
                  <p className="text-[11px] text-orange-600 font-bold bg-orange-50 p-2.5 rounded-lg border border-orange-100 animate-pulse shadow-sm">
                    🔥 Luar biasa! Kamu berhasil mendapatkan {analisis.achieved_count} pencapaian baru hari ini. Teruskan semangatmu!
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Segera hubungi Dosen Pembimbing Lapangan (DPL) Anda untuk koordinasi Magang Mandiri pada <strong>{lokasiMagang}</strong>.
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-2">
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
              {!isConfirmed && (
                <a
                  href={`/mahasiswa/laporan/templates/pengantar?posisiId=${pengajuan.posisi_id?._id || ''}&pengajuanId=${pengajuan._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-xl transition-colors shadow-sm dark:shadow-none"
                >
                  🖨️ Cetak Surat Pengantar
                </a>
              )}
            </div>
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

      {/* Kolom 2: Mini Achievement Board */}
      <button 
        onClick={() => router.push('/mahasiswa/pencapaian')}
        className="text-left h-full min-h-[14rem] bg-gradient-to-br from-indigo-50/80 to-emerald-50/80 dark:from-indigo-900/30 dark:to-emerald-900/30 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 transition-all hover:scale-[1.02] hover:border-indigo-400 hover:shadow-md flex flex-col relative overflow-hidden group justify-center items-center"
      >
        {/* Animated background blobs */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-10 w-32 h-32 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center h-full gap-2 w-full">
          <div className="text-5xl mb-2 animate-bounce drop-shadow-lg">
            🏆
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed px-2">
            Anda telah melalui aktifitas yang menyelesaikan <span className="text-indigo-600 dark:text-indigo-400 text-lg font-black mx-1">{analisis?.achievements?.filter(a => a.status === 'tercapai').length || 0}</span> dari <span className="text-slate-800 dark:text-slate-100 font-black">{analisis?.achievements?.length || 0}</span> CPMK.
          </p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 animate-pulse">
            Semangat magang dan jadilah berdampak!
          </p>
          
          <div className="mt-5 px-5 py-2.5 bg-white/80 dark:bg-slate-800/80 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-sm backdrop-blur-sm group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2">
            Lihat semua capaian <span className="opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(20px, -30px) scale(1.1); }
            66% { transform: translate(-15px, 15px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </button>

      {/* Kolom 3: Absensi Harian */}
      {loadingAbsensi || loadingPengajuan ? (
        <div className="h-full min-h-[8rem] bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none rounded-2xl animate-pulse border border-slate-300 dark:border-slate-600" />
      ) : (!pengajuan || pengajuan.status_pengajuan !== 'disetujui' || !pengajuan.is_dpl_confirmed) ? (
        <div className="h-full min-h-[8rem] relative bg-gradient-to-br from-indigo-500/10 to-blue-500/5 p-5 rounded-2xl border border-indigo-400/20 flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Persiapan Magang</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
                Pilihlah tempat magang terbaik yang sesuai dengan konsentrasi Anda. Terus semangat mempersiapkan diri!
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xl shrink-0">
              🌟
            </div>
          </div>
          <button 
            onClick={() => router.push('/alur')}
            className="w-full mt-4 py-2.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-xl transition-colors"
          >
            Baca Petunjuk & Alur
          </button>
        </div>
      ) : !absensiToday ? (
        <div className="h-full min-h-[8rem] relative bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-5 rounded-2xl border border-indigo-400/20 overflow-hidden flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Absensi & Rencana</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Belum check-in hari ini</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xl shrink-0">
              👋
            </div>
          </div>
          <button 
            onClick={() => setShowAbsensiModal(true)}
            className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            Mulai Check-In
          </button>
        </div>
      ) : (
        (() => {
          const todayDate = new Date();
          const localISOTime = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          const hasLogbookToday = analisis?.recent_logs?.some(log => log.tanggal.startsWith(localISOTime));
          const isPastNoon = todayDate.getHours() >= 12;

          return (
            <div className="h-full min-h-[8rem] relative bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-5 rounded-2xl border border-emerald-400/20 flex flex-col transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xl shrink-0">
                  {absensiToday.status === 'hadir' ? '🚀' : absensiToday.status === 'sakit' ? '🤒' : '✈️'}
                </div>
                <div className="w-full">
                  <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 capitalize">Status: {absensiToday.status}</h3>
                  <p className="text-[10px] font-bold text-slate-500">
                    {new Date(absensiToday.waktu_checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1 justify-between">
                {sisaHari !== null && (
                  <div className="mt-3 bg-blue-50/50 dark:bg-blue-900/10 p-2.5 rounded-xl border border-blue-100/50 dark:border-blue-800/30 flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase font-bold text-blue-500/80 dark:text-blue-400/80 shrink-0">⏳ Sisa Waktu Magang:</p>
                    <p className={`text-xs font-black tracking-wide text-right ${isExpired ? 'text-rose-500' : 'text-blue-700 dark:text-blue-300'}`}>
                      {isExpired ? 'Telah Selesai' : `${sisaHari} Hari Lagi`}
                    </p>
                  </div>
                )}
                <div className="bg-white/50 dark:bg-black/20 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/10">
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">{absensiToday.status === 'hadir' ? '🎯 Target:' : '📄 Keterangan:'}</p>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {absensiToday.status === 'hadir' ? absensiToday.rencana_kegiatan : absensiToday.alasan}
                  </p>
                </div>
                {isPastNoon && !hasLogbookToday && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800/50 flex items-start gap-1.5 animate-in fade-in zoom-in duration-500">
                    <span className="text-amber-500 text-[11px] mt-0.5">⚠️</span>
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-snug">
                      Waktu sudah lewat jam 12:00 siang. Jangan lupa simpan kegiatan harian di Logbook!
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );

  // Default tip saat loading atau error
  let fallbackTip = "Yuk jadilah proaktif! Diskusikan dengan mentormu hari ini, ajukan inisiatif atau tanyakan kegiatan apa yang bisa kamu kerjakan. Mentor pasti akan sangat mengapresiasi semangatmu!";

  return (
    <>
      {showAbsensiModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAbsensiModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/10 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  👋 Check-In Harian
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Rencanakan apa yang akan kamu lakukan hari ini.
                </p>
              </div>
              <button onClick={() => setShowAbsensiModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                <XCircle className="w-5 h-5 text-slate-500 dark:text-slate-300" />
              </button>
            </div>
            <form onSubmit={handleSubmitAbsensi} className="p-6 space-y-5">
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden w-fit">
                {['hadir', 'izin', 'sakit'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAbsensiStatus(st)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                      absensiStatus === st 
                        ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {absensiStatus === 'hadir' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl mb-5 border border-indigo-100 dark:border-indigo-800/50 flex items-start gap-3 shadow-sm">
                    <div className="text-xl mt-0.5 animate-bounce">💡</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1">Tips Hari Ini</p>
                      {loadingTip ? (
                        <div className="space-y-1 mt-2">
                          <div className="h-2.5 bg-indigo-200/50 dark:bg-indigo-700/30 rounded animate-pulse w-full"></div>
                          <div className="h-2.5 bg-indigo-200/50 dark:bg-indigo-700/30 rounded animate-pulse w-5/6"></div>
                          <div className="h-2.5 bg-indigo-200/50 dark:bg-indigo-700/30 rounded animate-pulse w-4/6"></div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiTip || fallbackTip }}></p>
                      )}
                    </div>
                  </div>

                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Target / Rencana Kerja Hari Ini</label>
                  <p className="text-xs text-slate-500 mb-2">Tuliskan 1-3 hal utama yang ingin kamu selesaikan.</p>
                  <textarea 
                    required 
                    value={rencanaKegiatan} 
                    onChange={(e) => setRencanaKegiatan(e.target.value)} 
                    rows="4" 
                    placeholder="Contoh: 1. Observasi sistem arsip di divisi HR, 2. Meeting pagi dengan mentor, 3. Input data laporan..." 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-900/50 text-sm leading-relaxed"
                  ></textarea>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Keterangan / Alasan {absensiStatus === 'sakit' ? 'Sakit' : 'Izin'}</label>
                    <textarea 
                      required 
                      value={alasan} 
                      onChange={(e) => setAlasan(e.target.value)} 
                      rows="2" 
                      placeholder="Jelaskan alasan secara singkat..." 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-900/50 text-sm leading-relaxed"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Upload Surat Keterangan (Wajib)</label>
                    <input required type="file" accept="image/*" onChange={handleFileAbsensiChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700" />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={submittingAbsensi}
                className="w-full py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 mt-2"
              >
                {submittingAbsensi ? 'Menyimpan...' : 'Submit Check-In'}
              </button>
            </form>
          </div>
        </div>
      )}
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
