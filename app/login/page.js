"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Grid lines background — penciri */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundSize: '60px 60px',
        backgroundImage: 'linear-gradient(to right, rgba(148,163,184,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.6) 1px, transparent 1px)'
      }} />
      {/* Decorative Ornaments */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-8 bg-[#0F172A]/15 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm dark:shadow-none backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_60px_rgb(0,0,0,0.3)] border border-slate-200 dark:border-slate-700">
        <div>
          <div className="text-center">
            <Link href="/" className="inline-block text-2xl font-black tracking-wider text-white mb-2">
              MANTAU<span className="text-blue-400">MAGANG</span>
            </Link>
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-white">
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
          
          <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 text-blue-300 p-4 rounded-xl text-sm mb-6">
            <span className="font-bold">💡 Informasi:</span> Untuk mahasiswa, silakan login menggunakan NIM dan Password default (Password default adalah NIM Anda). Pastikan untuk segera memperbarui password setelah berhasil masuk.
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2" htmlFor="email">Email / NIM</label>
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
                <a href="#" className="text-xs font-bold text-blue-400 hover:text-blue-300">Lupa password?</a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 placeholder:text-slate-500 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
