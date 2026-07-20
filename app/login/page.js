"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../components/ThemeContext';

export default function Login() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        if (session?.user?.role) {
          if (session.user.role === 'mahasiswa') {
            // KONDISI 1: Mutlak arahkan ke setup akun jika isFirstLogin === true
            if (session.user.isFirstLogin === true) {
              window.location.href = '/mahasiswa/setup-akun';
            } else {
              // KONDISI 2: Smart Redirect berdasarkan localStorage (Landing Page Memory)
              const targetMagang = localStorage.getItem('target_magang');
              if (targetMagang) {
                try {
                  const parsedTarget = JSON.parse(targetMagang);
                  if (parsedTarget.mitra_id && parsedTarget.posisi_id) {
                    window.location.href = `/mahasiswa/pengajuan/detail?mitra_id=${parsedTarget.mitra_id}&posisi_id=${parsedTarget.posisi_id}`;
                    return;
                  }
                } catch(e) {
                  console.error('Data target_magang tidak valid:', e);
                }
              }
              // KONDISI 3: Default landing point jika tidak ada memori
              window.location.href = '/mahasiswa';
            }
          }
          else if (session.user.role === 'dpl') window.location.href = '/dpl';
          else if (session.user.role === 'admin_prodi') window.location.href = '/admin';
          else if (session.user.role === 'mentor') window.location.href = '/mentor';
          else window.location.href = '/';
        } else {
          window.location.href = '/';
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F172A] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50">
        <button
          type="button"
          onClick={toggleTheme}
          className="relative w-14 h-7 rounded-full transition-all duration-500 flex items-center bg-slate-200 border-slate-300 hover:bg-slate-300 dark:bg-white/[0.08] dark:border-white/[0.1] dark:hover:bg-white/[0.12]"
          title={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
        >
          <div className={`absolute w-5 h-5 rounded-full transition-all duration-500 flex items-center justify-center shadow-lg ${
            isDark
              ? 'left-1 bg-blue-500 text-white shadow-blue-500/30'
              : 'left-8 bg-amber-400 text-white shadow-amber-400/30'
          }`}>
            {isDark ? <Moon size={14} /> : <Sun size={14} />}
          </div>
        </button>
      </div>

      {/* Grid lines background — penciri */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundSize: '60px 60px',
        backgroundImage: 'linear-gradient(to right, rgba(148,163,184,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.6) 1px, transparent 1px)'
      }} />
      {/* Decorative Ornaments */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-8 bg-white/50 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_8px_60px_rgb(0,0,0,0.3)] p-10 rounded-3xl border border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex justify-center items-center gap-4 sm:gap-6 mb-2">
            <img src="/logo_stimi.png" alt="STIMI Logo" className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" />
            <Link href="/" className="inline-block border-x border-slate-300 dark:border-slate-600 px-4 sm:px-6">
              <img src="/mm.png" alt="MANTAUMAGANG Logo" className="h-10 sm:h-12 w-auto block dark:hidden" />
              <img src="/mm_white.png" alt="MANTAUMAGANG Logo" className="h-10 sm:h-12 w-auto hidden dark:block" />
            </Link>
            <img src="/logo_berdampak.png" alt="Berdampak Logo" className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" />
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
            Selamat Datang
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Masuk untuk memantau aktivitas magang Anda
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-300 p-4 rounded-xl text-sm text-center font-medium">
              {error}
            </div>
          )}
          
          {/* Info block removed */}
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2" htmlFor="email">Email / NIM / Username</label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 placeholder:text-slate-500 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm transition-all"
                placeholder="Masukkan Email atau NIM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400" htmlFor="password">Password</label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 placeholder:text-slate-500 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm transition-all pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
