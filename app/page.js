"use client";

import Link from 'next/link';
import Image from 'next/image';
import LandingMitraList from '@/components/LandingMitraList';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();

  const getDashboardUrl = () => {
    if (!session || !session.user) return '/login';
    if (session.user.role === 'admin_prodi') return '/admin';
    return `/${session.user.role}`;
  };

  return (
    <main className="bg-slate-50 text-slate-800 font-sans antialiased bg-light-grid min-h-screen">
      
      {/* BAGIAN ATAS: NAVY BLUE (HERO SECTION) */}
      <div className="bg-[#0F172A] relative overflow-hidden pb-32">
        {/* Background Full Screen ala stimiyapmim.ac.id */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80" style={{ backgroundImage: "url('/mantau_hero.png')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/80 to-transparent"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

        {/* NAVBAR - LEBIH LEBAR */}
        <nav className="w-full px-8 lg:px-[5cm] py-6 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3 lg:gap-4">
            <Image src="/mm_white.png" alt="Mantau Magang Logo" width={180} height={60} className="h-10 lg:h-12 w-auto object-contain drop-shadow-md" priority />
            <div className="text-lg lg:text-xl font-extrabold tracking-widest text-slate-100 border-l border-slate-500/50 pl-3 lg:pl-4 h-8 lg:h-10 flex items-center">
              STIMI YAPMI
            </div>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('target_magang');
              window.location.href = getDashboardUrl();
            }}
            className="px-6 py-2 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all shadow-lg shadow-white/10"
          >
            {status === 'authenticated' && session?.user ? 'Ke Dashboard' : 'Login Sistem'}
          </button>
        </nav>

        {/* HERO SECTION - LEBIH LEBAR */}
        <section className="w-full px-8 lg:px-[5cm] relative z-10 flex items-center min-h-[450px]">
          {/* Kiri: Teks */}
          <div className="relative z-20 w-full lg:w-[65%] space-y-8 py-16">
            <div className="inline-block px-4 py-1 rounded-full border border-blue-400/30 bg-blue-900/30 text-blue-300 text-sm font-medium backdrop-blur-sm">
              STIMI YAPMI Makassar
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-100 leading-[1.15]">
              Manajemen Aktivitas, <span className="text-blue-400">peNilaian</span>, & Tata Administrasi Umum Mahasiswa Magang Berdampak STIMI YAPMI
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
              Telusuri lowongan magang berdampak mandiri. Memudahkan mahasiswa, Dosen Pembimbing Lapangan (DPL), dan Program Studi dalam mengelola administrasi, logbook, dan konversi SKS kegiatan magang secara digital.
            </p>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => {
                  localStorage.removeItem('target_magang');
                  window.location.href = getDashboardUrl();
                }} 
                className="px-8 py-3.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold text-lg transition-all shadow-lg shadow-blue-500/30"
              >
                {status === 'authenticated' ? 'Cari Posisi' : 'Cari Posisi'}
              </button>
              <Link href="/alur" className="px-8 py-3.5 rounded-lg border-2 border-slate-500 hover:bg-slate-800 text-slate-100 font-bold text-lg transition-all inline-block text-center">
                Pelajari Alur
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* AREA KONTEN BAWAH */}
      <section className="w-full px-8 lg:px-[5cm] -mt-24 relative z-20 pb-16">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgb(0,0,0,0.06)] p-10 lg:p-16 border border-white/50">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Apa itu Magang Berdampak STIMI YAPMI ?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Card 1 */}
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 hover:border-blue-200 transition-all duration-500 group hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] hover:-translate-y-2">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl pointer-events-none group-hover:text-blue-500 group-hover:opacity-10 transition-all duration-500 group-hover:-translate-y-4 group-hover:rotate-12">🎓</div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">🎓</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Bagi Mahasiswa</h3>
                <p className="text-slate-600 text-base leading-relaxed">Mendapatkan pengalaman nyata di dunia industri, mengembangkan soft skill, dan membangun portofolio profesional sebelum lulus.</p>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 hover:border-blue-200 transition-all duration-500 group hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] hover:-translate-y-2">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl pointer-events-none group-hover:text-blue-500 group-hover:opacity-10 transition-all duration-500 group-hover:-translate-y-4 group-hover:rotate-12">🏛️</div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">🏛️</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Bagi Kampus</h3>
                <p className="text-slate-600 text-base leading-relaxed">Memperluas jaringan kemitraan institusi, memastikan relevansi kurikulum dengan kebutuhan industri, dan memperkuat data lulusan.</p>
              </div>
            </div>
            
            {/* Card 3 */}
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 hover:border-blue-200 transition-all duration-500 group hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] hover:-translate-y-2">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl pointer-events-none group-hover:text-blue-500 group-hover:opacity-10 transition-all duration-500 group-hover:-translate-y-4 group-hover:rotate-12">🎯</div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">🎯</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Implementasi OBE</h3>
                <p className="text-slate-600 text-base leading-relaxed">Mendukung Outcome-Based Education melalui konversi SKS yang terukur berdasarkan capaian kinerja mahasiswa di lapangan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ETALASE PERUSAHAAN & POSISI */}
      <section className="w-full px-8 lg:px-[5cm] pb-24 relative z-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Temukan Lokasi Magang</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Pilih instansi mitra yang sesuai dengan minat dan konsentrasi program studi Anda. Berdampaklah bagi industri dan masyarakat luas bersama STIMI YAPMI.
          </p>
        </div>
        
        <LandingMitraList />
      </section>

    </main>
  );
}
