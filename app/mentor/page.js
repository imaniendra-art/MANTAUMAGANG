"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function MentorDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ pendingLogbooks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/logbook?role=mentor&userId=${session.user.id}`)
        .then(r => r.json())
        .then(data => {
          setStats({ pendingLogbooks: Array.isArray(data) ? data.length : 0 });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  const notificationCards = loading ? (
    <div className="h-32 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none rounded-2xl animate-pulse border border-slate-300 dark:border-slate-600" />
  ) : (
    <>
      {/* Password Change Alert */}
      {session?.user?.isFirstLogin && (
        <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-amber-200/50 dark:border-amber-800/50 flex items-start gap-4 shadow-sm dark:shadow-none mb-6 transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
            ⚠️
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Keamanan Akun</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Anda masih menggunakan password default. Demi keamanan, silakan segera ubah password Anda.
            </p>
            <div className="mt-3">
              <Link href="/profil" className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
                Perbarui Profil
              </Link>
            </div>
          </div>
        </div>
      )}

      {stats.pendingLogbooks > 0 ? (
        <div className="relative bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-6 rounded-2xl border border-cyan-400/20 flex items-center gap-5 overflow-hidden">
          <div className="absolute -right-2 -bottom-2 text-7xl opacity-[0.06] pointer-events-none">📋</div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center text-2xl shrink-0">
            📝
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-cyan-300">Logbook Menunggu Validasi</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.pendingLogbooks} <span className="text-base font-semibold text-cyan-400">catatan</span></p>
          </div>
        </div>
      ) : (
        <div className="bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
            ✅
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Validasi Logbook</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">Semua tervalidasi</p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <DashboardLayout title="Dashboard Mentor / Pembimbing Lapangan" notifications={notificationCards}>
      {/* Children kosong — semua konten di hero + notif + menu cards */}
    </DashboardLayout>
  );
}
