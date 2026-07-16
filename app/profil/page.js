"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profilData, setProfilData] = useState({
    nidn: "",
    nomor_hp: "",
    email: ""
  });
  
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingProfil, setLoadingProfil] = useState(false);
  const [messagePassword, setMessagePassword] = useState(null);
  const [messageProfil, setMessageProfil] = useState(null);

  const role = session?.user?.role;
  let dashboardPath = "/";
  if (role === "admin_prodi") dashboardPath = "/admin";
  else if (role === "mahasiswa") dashboardPath = "/mahasiswa";
  else if (role === "dpl") dashboardPath = "/dpl";
  else if (role === "mentor") dashboardPath = "/mentor";

  // Inisialisasi data profil saat session tersedia
  useEffect(() => {
    if (session?.user) {
      setProfilData({
        nidn: session.user.nidn || "",
        nomor_hp: session.user.nomor_hp || "",
        email: session.user.email || ""
      });
    }
  }, [session]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessagePassword({ type: "error", text: "Password baru dan konfirmasi password tidak cocok." });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessagePassword({ type: "error", text: "Password baru minimal 6 karakter." });
      return;
    }

    setLoadingPassword(true);
    setMessagePassword(null);

    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setMessagePassword({ type: "error", text: data.error || "Gagal mengubah password." });
      } else {
        alert("Password berhasil diubah. Silakan login kembali dengan password baru pada sesi berikutnya.");
        setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        router.push(dashboardPath);
      }
    } catch (error) {
      setMessagePassword({ type: "error", text: "Terjadi kesalahan sistem." });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleProfilSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfil(true);
    setMessageProfil(null);

    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilData)
      });

      const data = await res.json();
      if (!res.ok) {
        setMessageProfil({ type: "error", text: data.error || "Gagal memperbarui profil." });
      } else {
        setMessageProfil({ type: "success", text: "Profil berhasil diperbarui. Silakan muat ulang halaman jika perubahan tidak langsung terlihat." });
        // Optional: Call session update if using next-auth update feature, 
        // tapi validasi real-time JWT akan memperbaruinya pada request berikutnya.
      }
    } catch (error) {
      setMessageProfil({ type: "error", text: "Terjadi kesalahan sistem." });
    } finally {
      setLoadingProfil(false);
    }
  };

  return (
    <DashboardLayout title="Pengaturan Profil" backPath={dashboardPath}>
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-8 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              👤 Profil Anda
            </h2>
          </div>
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Nama Lengkap</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{session?.user?.nama_lengkap}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Role / Peran</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 uppercase">{session?.user?.role}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {role === 'mahasiswa' ? 'NIM' : 'ID (Username)'}
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{session?.user?.nim_nidn}</p>
              </div>
              {session?.user?.nidn && role !== 'mahasiswa' && (
                <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">NIDN</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{session?.user?.nidn}</p>
                </div>
              )}
            </div>
            
            <hr className="border-slate-200 dark:border-slate-700 mb-8" />
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Ubah Informasi Profil</h3>
            
            {messageProfil && (
              <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${messageProfil.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {messageProfil.type === 'error' ? '⚠️ ' : '✅ '}{messageProfil.text}
              </div>
            )}
            
            <form onSubmit={handleProfilSubmit} className="space-y-5 mb-8">
              {role !== 'mahasiswa' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">NIDN / NIP</label>
                  <input 
                    type="text" 
                    value={profilData.nidn}
                    onChange={(e) => setProfilData({...profilData, nidn: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan NIDN atau NIP Anda"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={profilData.email}
                  onChange={(e) => setProfilData({...profilData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="email@contoh.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nomor Telepon / WhatsApp</label>
                <input 
                  type="text" 
                  value={profilData.nomor_hp}
                  onChange={(e) => setProfilData({...profilData, nomor_hp: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="08123456789"
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loadingProfil}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {loadingProfil ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>

            <hr className="border-slate-200 dark:border-slate-700 mb-8" />
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Ubah Password</h3>
            
            {messagePassword && (
              <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${messagePassword.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {messagePassword.type === 'error' ? '⚠️ ' : '✅ '}{messagePassword.text}
              </div>
            )}
            
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password Lama</label>
                <input 
                  type="password" 
                  required
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password Baru</label>
                <input 
                  type="password" 
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Konfirmasi Password Baru</label>
                <input 
                  type="password" 
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loadingPassword}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {loadingPassword ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
