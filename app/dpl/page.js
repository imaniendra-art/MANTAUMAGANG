"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DPLDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ totalMhs: 0, pendingValidasi: 0, pendingEvaluasi: 0, pendingLaporan: 0, pendingPengantaran: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      Promise.all([
        fetch(`/api/logbook?role=dpl&userId=${session.user.id}`).then(r => r.json()).catch(() => []),
        fetch(`/api/evaluasi?dplId=${session.user.id}`).then(r => r.json()).catch(() => []),
        fetch(`/api/laporan-akhir?role=dpl&dplId=${session.user.id}`).then(r => r.json()).catch(() => []),
      ]).then(([logbooks, students, laporans]) => {
        setStats({
          totalMhs: Array.isArray(students) ? students.length : 0,
          pendingValidasi: Array.isArray(logbooks) ? logbooks.filter(l => l.status_validasi === 'menunggu_mentor').length : 0,
          pendingEvaluasi: Array.isArray(students) ? students.filter(s => !(s.penilaian_dpl && s.penilaian_dpl.sistematika_laporan != null)).length : 0,
          pendingLaporan: Array.isArray(laporans) ? laporans.filter(l => l.status === 'submitted').length : 0,
          pendingPengantaran: Array.isArray(students) ? students.filter(s => !s.is_dpl_confirmed).length : 0,
        });
        setLoading(false);
      });
    }
  }, [session]);

  const notificationCards = loading ? (
    <>
      <div className="h-32 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none rounded-2xl animate-pulse border border-slate-300 dark:border-slate-600" />
      <div className="h-32 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none rounded-2xl animate-pulse border border-slate-300 dark:border-slate-600" />
    </>
  ) : (
    <>
      {/* Password Change Alert */}
      {session?.user?.isFirstLogin && (
        <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-amber-200/50 dark:border-amber-800/50 flex items-start gap-4 shadow-sm dark:shadow-none mb-6 transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
            ⚠️
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Lengkapi Profil & Keamanan Akun</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Anda masih menggunakan password default. Demi keamanan, silakan segera ubah password Anda dan lengkapi data profil (seperti NIDN, No. Telepon, dan Email).
            </p>
            <div className="mt-3">
              <Link href="/profil" className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
                Perbarui Profil
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Mahasiswa Bimbingan */}
        <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-5 transition-all hover:shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center text-2xl shrink-0">
            👨‍🎓
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Mahasiswa Bimbingan</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.totalMhs}</p>
          </div>
        </div>

        {/* Pending Pengantaran */}
        {stats.pendingPengantaran > 0 ? (
          <a href="/dpl/bimbingan" className="relative bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-pink-400/30 flex items-center gap-5 overflow-hidden transition-all hover:shadow-md cursor-pointer">
            <div className="absolute -right-2 -bottom-2 text-7xl opacity-[0.06] pointer-events-none">🚗</div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20 flex items-center justify-center text-2xl shrink-0">
              🚗
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-pink-500 dark:text-pink-400">Butuh Pengantaran</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.pendingPengantaran} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">mahasiswa</span></p>
            </div>
          </a>
        ) : (
          <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-5 transition-all hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
              🚀
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Status Pengantaran</p>
              <p className="text-lg font-bold text-emerald-500 dark:text-emerald-400 mt-1">Semua diserahkan</p>
            </div>
          </div>
        )}

        {/* Pending Validasi */}
        {stats.pendingValidasi > 0 ? (
          <div className="relative bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-blue-400/30 flex items-center gap-5 overflow-hidden transition-all hover:shadow-md">
            <div className="absolute -right-2 -bottom-2 text-7xl opacity-[0.06] pointer-events-none">📝</div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center text-2xl shrink-0">
              ✍️
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-blue-500 dark:text-blue-400">Logbook Menunggu</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.pendingValidasi} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">entri</span></p>
            </div>
          </div>
        ) : (
          <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-5 transition-all hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
              ✅
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Validasi Logbook</p>
              <p className="text-lg font-bold text-emerald-500 dark:text-emerald-400 mt-1">Semua tervalidasi</p>
            </div>
          </div>
        )}

        {/* Pending Laporan Akhir */}
        {stats.pendingLaporan > 0 ? (
          <a href="/dpl/validasi-laporan" className="relative bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-amber-400/30 flex items-center gap-5 overflow-hidden transition-all hover:shadow-md cursor-pointer">
            <div className="absolute -right-2 -bottom-2 text-7xl opacity-[0.06] pointer-events-none">📑</div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center text-2xl shrink-0">
              📑
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-amber-500 dark:text-amber-400">Laporan Menunggu</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.pendingLaporan} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">berkas</span></p>
            </div>
          </a>
        ) : (
          <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-5 transition-all hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
              🌟
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Validasi Laporan</p>
              <p className="text-lg font-bold text-emerald-500 dark:text-emerald-400 mt-1">Semua tervalidasi</p>
            </div>
          </div>
        )}
        
        {/* Pending Evaluasi */}
        {stats.pendingEvaluasi > 0 ? (
          <a href="/dpl/evaluasi" className="relative bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-violet-400/30 flex items-center gap-5 overflow-hidden transition-all hover:shadow-md cursor-pointer">
            <div className="absolute -right-2 -bottom-2 text-7xl opacity-[0.06] pointer-events-none">💯</div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 flex items-center justify-center text-2xl shrink-0">
              💯
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-violet-500 dark:text-violet-400">Perlu Dinilai</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.pendingEvaluasi} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">mahasiswa</span></p>
            </div>
          </a>
        ) : (
          <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-5 transition-all hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
              🏆
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Penilaian Akhir</p>
              <p className="text-lg font-bold text-emerald-500 dark:text-emerald-400 mt-1">Semua dinilai</p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <DashboardLayout title="Dashboard DPL" notifications={notificationCards}>
      {/* Children kosong — semua konten di hero + notif + menu cards */}
    </DashboardLayout>
  );
}
