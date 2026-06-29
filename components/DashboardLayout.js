"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./ThemeContext";
import { useState, useRef, useEffect } from "react";

// ═══════════════════════ ICON COMPONENTS ═══════════════════════
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-inherit group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ═══════════════════════ THEME TOGGLE BUTTON ═══════════════════════
function ThemeToggle({ toggleTheme, isDark }) {
  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-7 rounded-full transition-all duration-500 flex items-center bg-slate-200 border-slate-300 hover:bg-slate-300 dark:bg-white/[0.08] dark:border-white/[0.1] dark:hover:bg-white/[0.12]`}
      title={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
    >
      <div className={`absolute w-5 h-5 rounded-full transition-all duration-500 flex items-center justify-center shadow-lg ${
        isDark
          ? 'left-1 bg-blue-500 text-white shadow-blue-500/30'
          : 'left-7.5 bg-amber-400 text-white shadow-amber-400/30'
      }`}>
        {isDark ? <MoonIcon /> : <SunIcon />}
      </div>
    </button>
  );
}

// ═══════════════════════ USER MENU BUTTON ═══════════════════════
function UserMenu({ nama, role }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-2xl border transition-all duration-300 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">{nama}</p>
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mt-0.5">{role.replace('_', ' ')}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
          {nama ? nama.charAt(0).toUpperCase() : 'U'}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 sm:hidden">
            <p className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">{nama}</p>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mt-0.5">{role.replace('_', ' ')}</p>
          </div>
          <Link href="/profil" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            ⚙️ Pengaturan Profil
          </Link>
          <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 w-full text-left px-4 py-3.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            🚪 Keluar
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ MENU CONFIG ═══════════════════════
const MENU_CONFIG = {
  admin_prodi: {
    greeting: "Admin & Prodi",
    subtitle: "Kelola master data, monitoring seluruh aktivitas magang, dan pantau DPL serta Mahasiswa.",
    menus: [
      { name: "Manajemen Pengguna", href: "/admin/pengguna", icon: "👥", desc: "Kelola akun Mahasiswa, DPL, dan Mentor.", color: "from-blue-500 to-blue-600" },
      { name: "Master Data", href: "/admin/master-data", icon: "🗂️", desc: "Kelola Instansi Mitra, Posisi, dan Matkul.", color: "from-indigo-500 to-indigo-600" },
      { name: "Validasi dan Data Pengajuan", href: "/admin/validasi", icon: "📋", desc: "Persetujuan magang & plotting DPL.", color: "from-emerald-500 to-emerald-600" },
      { name: "Monitoring Magang", href: "/admin/monitoring", icon: "👁️", desc: "Pantau logbook dan kendala lapangan.", color: "from-amber-500 to-amber-600" },
      { name: "Rekapitulasi Nilai", href: "/admin/rekapitulasi", icon: "⭐", desc: "Hasil akhir dan konversi SKS.", color: "from-purple-500 to-purple-600" },
      { name: "Arsip & Dokumen", href: "/admin/arsip", icon: "🖨️", desc: "Cetak surat pengantar & sertifikat.", color: "from-rose-500 to-rose-600" },
      { name: "Sinkronisasi PDDikti", href: "/admin/sinkronisasi", icon: "☁️", desc: "Ekspor data pelaporan PDDikti.", color: "from-cyan-500 to-cyan-600" },
      { name: "Pengaturan Sistem", href: "/admin/settings", icon: "⚙️", desc: "Konfigurasi aplikasi dan periode.", color: "from-slate-500 to-slate-600" },
    ],
  },
  mahasiswa: {
    greeting: "Mahasiswa",
    subtitle: "Kumpulkan poin dengan menyelesaikan indikator CPMK setiap harinya.",
    menus: [
      { name: "Pengajuan Magang", href: "/mahasiswa/pengajuan", icon: "📝", desc: "Ajukan dan kelola pengajuan magang baru", color: "from-blue-500 to-indigo-600" },
      { name: "Logbook Harian", href: "/mahasiswa/logbook", icon: "📖", desc: "Catat kegiatan harian dan kumpulkan poin kinerja", color: "from-emerald-500 to-teal-600" },
      { name: "Laporan & Sertifikat", href: "/mahasiswa/laporan", icon: "📄", desc: "Unduh laporan magang dan sertifikat pencapaian", color: "from-amber-500 to-orange-600" },
    ],
  },
  dpl: {
    greeting: "Dosen Pembimbing",
    subtitle: "Pantau aktivitas mahasiswa bimbingan Anda dan berikan penilaian berkala.",
    menus: [
      { name: "Daftar Bimbingan", href: "/dpl/bimbingan", icon: "📋", desc: "Pantau dan konfirmasi penyerahan mahasiswa", color: "from-blue-500 to-indigo-600" },
      { name: "Validasi Logbook", href: "/dpl/validasi", icon: "✍️", desc: "Review dan validasi logbook harian mahasiswa", color: "from-emerald-500 to-teal-600" },
      { name: "Evaluasi Akhir", href: "/dpl/evaluasi", icon: "📊", desc: "Lakukan evaluasi akhir dan penilaian kinerja", color: "from-amber-500 to-orange-600" },
    ],
  },
  mentor: {
    greeting: "Mentor Industri",
    subtitle: "Validasi logbook harian dan pantau perkembangan mahasiswa magang.",
    menus: [
      { name: "Validasi Logbook", href: "/mentor/validasi", icon: "✍️", desc: "Review dan validasi logbook harian mahasiswa", color: "from-cyan-500 to-blue-600" },
    ],
  },
};

const SUB_PAGE_TITLES = {
  "/admin/validasi": "Validasi dan Data Pengajuan",
  "/admin/master-data": "Manajemen Data",
  "/admin/settings": "Pengaturan",
  "/mahasiswa/pengajuan": "Pengajuan Magang",
  "/mahasiswa/logbook": "Logbook Harian",
  "/mahasiswa/laporan": "Laporan & Sertifikat",
  "/dpl/validasi": "Validasi Logbook",
  "/dpl/evaluasi": "Evaluasi Akhir",
  "/mentor/validasi": "Validasi Logbook",
};

// ═══════════════════════ GRID BACKGROUND ═══════════════════════
function GridBackground({ isDark, size = 60 }) {
  // Menggunakan SVG Pattern murni untuk menghindari cache CSS & konflik background-image
  const strokeColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.08)';
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="mainGrid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke={strokeColor} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mainGrid)" />
    </svg>
  );
}

// ═══════════════════════ MAIN EXPORT ═══════════════════════
export default function DashboardLayout({ children, title = "Dashboard", notifications = null, backPath = null }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-900">
        <GridBackground isDark={isDark} />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 rounded-full animate-spin border-blue-500/30 border-t-blue-500 dark:border-blue-400/30 dark:border-t-blue-400" />
          <div className="text-lg font-bold animate-pulse text-slate-500 dark:text-slate-400">Memuat data...</div>
        </div>
      </div>
    );
  }

  const role = session?.user?.role || "guest";
  const nama = session?.user?.nama_lengkap || "Pengguna";
  const config = MENU_CONFIG[role] || MENU_CONFIG.mahasiswa;

  const dashboardPaths = ["/admin", "/mahasiswa", "/dpl", "/mentor"];
  const isMainDashboard = dashboardPaths.includes(pathname);
  const parentPath = backPath || ("/" + pathname.split("/")[1]);
  const subPageTitle = SUB_PAGE_TITLES[pathname] || title;

  // ═══════════════════════ SUB-PAGE LAYOUT ═══════════════════════
  if (!isMainDashboard) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900">
        <GridBackground isDark={isDark} />
        {/* Glow effects */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-blue-500/[0.03] dark:bg-blue-500/5" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] blur-[100px] rounded-full pointer-events-none bg-indigo-500/[0.03] dark:bg-indigo-500/5" />

        {/* Sticky Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl border-b bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
          <div className="w-full px-8 lg:px-[5cm] py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(parentPath)}
                className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-300 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none"
              >
                <BackIcon />
                <span className="text-sm font-semibold">Kembali</span>
              </button>
              <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700" />
              <h1 className="hidden sm:block text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">{subPageTitle}</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle toggleTheme={toggleTheme} isDark={isDark} />
              <UserMenu nama={nama} role={role} />
            </div>
          </div>
        </header>

        {/* Sub-page Content */}
        <main className="relative w-full px-8 lg:px-[5cm] py-8">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════ MAIN DASHBOARD LAYOUT ═══════════════════════
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900">
      <GridBackground isDark={isDark} />
      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-blue-500/[0.04] dark:bg-blue-500/8" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] blur-[100px] rounded-full pointer-events-none bg-indigo-500/[0.03] dark:bg-indigo-500/6" />

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className="w-full px-8 lg:px-[5cm] py-5 flex justify-between items-center relative z-50">
        <Link href="/" className="text-xl font-black tracking-wider text-slate-800 dark:text-slate-100">
          MANTAU<span className="text-blue-500">MAGANG</span>
        </Link>
        <div className="flex items-center gap-5">
          <ThemeToggle toggleTheme={toggleTheme} isDark={isDark} />
          <UserMenu nama={nama} role={role} />
        </div>
      </nav>

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative z-10 w-full px-8 lg:px-[5cm] pt-6">
        <div className="relative rounded-[2rem] p-8 lg:p-10 overflow-hidden border bg-[#0F172A]/15 dark:bg-gradient-to-br dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] backdrop-blur-xl border-slate-300/50 dark:border-slate-800">
          {/* Hero grid overlay (SVG) */}
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden opacity-100">
             <svg className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
               <defs>
                 <pattern id="heroGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                   <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'} strokeWidth="1" />
                 </pattern>
               </defs>
               <rect width="100%" height="100%" fill="url(#heroGrid)" />
             </svg>
          </div>
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-block px-4 py-1.5 rounded-full border border-blue-400/30 dark:border-blue-400/20 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-widest mb-4">
              {role.replace('_', ' ')} Panel
            </div>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-3">
              Selamat Datang, <span className="text-blue-600 dark:text-blue-400">{nama.split(' ')[0]}</span>!
            </h1>
            <p className="text-lg text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed">
              {config.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ NOTIFICATION CARDS / HIGHLIGHTS ═══════════════ */}
      {notifications && (
        <section className="relative z-10 w-full px-8 lg:px-[5cm] mt-6 mb-10">
          {notifications}
        </section>
      )}

      {/* ═══════════════ MENU CARDS ═══════════════ */}
      <section className="relative z-10 w-full px-8 lg:px-[5cm] pb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Menu Utama</h2>
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${config.menus.length >= 4 ? 'lg:grid-cols-4' : config.menus.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-5 lg:gap-6`}>
          {config.menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="group relative rounded-2xl p-7 lg:p-8 transition-all duration-500 hover:-translate-y-1 border bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl hover:bg-[#0F172A]/25 dark:hover:bg-slate-700/40 border-slate-200 dark:border-slate-700 hover:border-blue-400/40 dark:hover:border-blue-500/30 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]"
            >
              {/* Menu card grid overlay (SVG) */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none rounded-2xl transition-opacity duration-500 overflow-hidden">
                 <svg className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                   <defs>
                     <pattern id="menuGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                       <path d="M 20 0 L 0 0 0 20" fill="none" stroke={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'} strokeWidth="1" />
                     </pattern>
                   </defs>
                   <rect width="100%" height="100%" fill="url(#menuGrid)" />
                 </svg>
              </div>

              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${menu.color} text-white shadow-lg flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                  {menu.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 transition-colors duration-300 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {menu.name}
                </h3>
                <p className="text-sm leading-relaxed transition-colors duration-300 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                  {menu.desc}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="absolute top-7 right-7 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 bg-slate-100 dark:bg-slate-900/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/20 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                <ArrowRightIcon />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════ EXTRA CONTENT (CHILDREN) ═══════════════ */}
      {children && (
        <section className="relative z-10 w-full px-8 lg:px-[5cm] pb-20">
          {children}
        </section>
      )}
    </div>
  );
}
