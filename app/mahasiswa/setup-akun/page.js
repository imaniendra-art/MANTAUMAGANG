"use client";

import { useState } from 'react';
import { signOut } from 'next-auth/react';

export default function SetupAkun() {
  const [konsentrasi, setKonsentrasi] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!konsentrasi || !kegiatan || !nomorHp || !password) {
      return setError('Semua field wajib diisi.');
    }

    if (password.length < 6) {
      return setError('Password baru minimal 6 karakter.');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/mahasiswa/setup-akun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ konsentrasi, kegiatan, nomor_hp: nomorHp, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Terjadi kesalahan.');
      }

      setSuccess('Profil dan password berhasil diperbarui. Mengalihkan ke halaman login...');
      
      // Logout secara bersih menggunakan callbackUrl NextAuth
      setTimeout(async () => {
        await signOut({ callbackUrl: '/login' });
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold tracking-tight">Setup Akun Mahasiswa</h2>
          <p className="text-sm text-blue-100 mt-2">Silakan lengkapi profil Anda untuk melanjutkan</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 font-medium">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-4 rounded-xl text-sm mb-6 font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Pilih Konsentrasi Program Studi
              </label>
              <select
                required
                value={konsentrasi}
                onChange={(e) => setKonsentrasi(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white appearance-none"
              >
                <option value="" disabled>-- Pilih Konsentrasi --</option>
                <option value="SDM">SDM</option>
                <option value="Keuangan">Keuangan</option>
                <option value="Pemasaran">Pemasaran</option>
                <option value="Pengembangan Bisnis">Pengembangan Bisnis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Pilih Jenis Kegiatan
              </label>
              <select
                required
                value={kegiatan}
                onChange={(e) => setKegiatan(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white appearance-none"
              >
                <option value="" disabled>-- Pilih Jenis Kegiatan --</option>
                <option value="Magang Berdampak">Magang Berdampak</option>
                <option value="Kewirausahaan">Kewirausahaan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Nomor HP / WhatsApp
              </label>
              <input
                type="text"
                required
                value={nomorHp}
                onChange={(e) => setNomorHp(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white"
                placeholder="Contoh: 081234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Password Baru
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white"
                placeholder="Masukkan password baru yang aman"
              />
            </div>

            <div className="pt-4 shrink-0">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan & Login Ulang'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
