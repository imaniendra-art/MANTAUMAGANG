"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { signIn } from "next-auth/react";

export default function MasterDplPage() {
  const [dpls, setDpls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Impersonate state
  const [impersonatingDpl, setImpersonatingDpl] = useState(null);
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  // Student list modal state
  const [selectedDplStudents, setSelectedDplStudents] = useState(null);

  // Add / Edit Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    id: "",
    nama_lengkap: "",
    nim_nidn: "",
    nidn: "",
    email: "",
    nomor_hp: "",
    password: ""
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchDpls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dpl');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDpls(data);
      }
    } catch (err) {
      console.error("Gagal memuat data DPL:", err);
      showToast("❌ Gagal memuat data DPL");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDpls();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDpls]);

  // Handler Impersonate (Login sebagai DPL)
  const handleImpersonateConfirm = async () => {
    if (!impersonatingDpl) return;
    setIsProcessingLogin(true);

    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dplId: impersonatingDpl._id })
      });

      const data = await res.json();
      if (res.ok && data.impersonateToken) {
        showToast(`🚀 Membuka ruang kerja ${impersonatingDpl.nama_lengkap}...`);
        
        // Panggil NextAuth signIn dengan token delegasi
        const signInResult = await signIn('credentials', {
          impersonateToken: data.impersonateToken,
          redirect: false
        });

        if (signInResult?.ok) {
          window.location.href = '/dpl/bimbingan';
        } else {
          alert("Gagal mengalihkan sesi: " + (signInResult?.error || "Error NextAuth"));
          setIsProcessingLogin(false);
        }
      } else {
        alert("Gagal melakukan login impersonasi: " + (data.error || "Gagal membuat token"));
        setIsProcessingLogin(false);
      }
    } catch (err) {
      console.error("Error impersonating DPL:", err);
      alert("Terjadi kesalahan sistem saat mencoba masuk sebagai DPL.");
      setIsProcessingLogin(false);
    }
  };

  // Handler Tambah DPL
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/dpl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setForm({ id: "", nama_lengkap: "", nim_nidn: "", nidn: "", email: "", nomor_hp: "", password: "" });
        showToast("✅ Berhasil Menambahkan DPL Baru!");
        fetchDpls();
      } else {
        alert("Gagal menambah DPL: " + (data.error || "Terjadi kesalahan"));
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler Edit DPL
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/dpl', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        showToast("✅ Berhasil Memperbarui Data DPL!");
        fetchDpls();
      } else {
        alert("Gagal memperbarui DPL: " + (data.error || "Terjadi kesalahan"));
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler Reset Password
  const handleResetPassword = async (dpl) => {
    if (!confirm(`Reset password untuk ${dpl.nama_lengkap}? Password akan di-reset ke NIDN/Username (${dpl.nim_nidn}).`)) return;

    try {
      const res = await fetch('/api/admin/dpl', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dpl._id,
          nim_nidn: dpl.nim_nidn,
          reset_password: true
        })
      });
      if (res.ok) {
        showToast(`✅ Password ${dpl.nama_lengkap} berhasil di-reset!`);
        fetchDpls();
      } else {
        const err = await res.json();
        alert("Gagal reset password: " + err.error);
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem.");
    }
  };

  // Handler Hapus DPL
  const handleDelete = async (dpl) => {
    if (dpl.total_mahasiswa > 0) {
      alert(`Tidak dapat menghapus ${dpl.nama_lengkap} karena masih memiliki ${dpl.total_mahasiswa} mahasiswa bimbingan aktif. Silakan alihkan mahasiswa tersebut ke DPL lain terlebih dahulu melalui menu Validasi Pengajuan.`);
      return;
    }

    if (!confirm(`Yakin ingin menghapus DPL ${dpl.nama_lengkap}?`)) return;

    try {
      const res = await fetch(`/api/admin/dpl?id=${dpl._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast("🗑️ DPL berhasil dihapus");
        fetchDpls();
      } else {
        alert("Gagal menghapus: " + (data.error || "Error"));
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem");
    }
  };

  // Filter Search
  const filteredDpls = dpls.filter(d => 
    d.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.nim_nidn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.nidn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDpl = dpls.length;
  const dplActiveBimbingan = dpls.filter(d => d.total_mahasiswa > 0).length;
  const totalMahasiswaDibimbing = dpls.reduce((acc, curr) => acc + (curr.total_mahasiswa || 0), 0);

  return (
    <DashboardLayout title="Master DPL (Dosen Pembimbing Lapangan)">
      
      {toastMessage && (
        <div className="fixed top-24 right-8 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-6 py-3 rounded-xl shadow-lg z-50 animate-in slide-in-from-right-10 fade-in duration-300 font-bold">
          {toastMessage}
        </div>
      )}

      <div className="space-y-6">

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-3 backdrop-blur-sm">
                <span>👨‍🏫</span> Kelola Akses & Bimbingan DPL
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Master Dosen Pembimbing Lapangan</h1>
              <p className="text-white/80 text-sm mt-1 max-w-2xl leading-relaxed">
                Kelola data dosen pembimbing, pantau plotting mahasiswa bimbingan, dan gunakan <strong>Mode Bantuan (Login Sebagai DPL)</strong> untuk membantu bimbingan dan validasi logbook tanpa perlu keluar dari akun admin.
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  setForm({ id: "", nama_lengkap: "", nim_nidn: "", nidn: "", email: "", nomor_hp: "", password: "" });
                  setShowAddModal(true);
                }}
                className="px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-black text-sm rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <span>➕</span> Tambah DPL Baru
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold">
              👨‍🏫
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total DPL Terdaftar</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalDpl} <span className="text-xs font-medium text-slate-400">Dosen</span></h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold">
              📋
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">DPL Membimbing</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{dplActiveBimbingan} <span className="text-xs font-medium text-slate-400">Aktif</span></h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl font-bold">
              🎓
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Mahasiswa Dibimbing</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalMahasiswaDibimbing} <span className="text-xs font-medium text-slate-400">Mahasiswa</span></h3>
            </div>
          </div>
        </div>

        {/* Table & Search Card */}
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Cari DPL berdasarkan nama / NIDN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan <strong>{filteredDpls.length}</strong> dari {totalDpl} DPL
            </p>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">
                Memuat daftar DPL...
              </div>
            ) : filteredDpls.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                Tidak ada data DPL yang sesuai dengan pencarian.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-4 text-center w-12">No</th>
                    <th className="py-4 px-4 text-left">Nama Dosen & Gelar</th>
                    <th className="py-4 px-4 text-left">NIDN / Username</th>
                    <th className="py-4 px-4 text-left">Kontak</th>
                    <th className="py-4 px-4 text-center">Bimbingan</th>
                    <th className="py-4 px-4 text-center">Mode Bantuan</th>
                    <th className="py-4 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredDpls.map((dpl, idx) => (
                    <tr key={dpl._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4 text-center text-sm font-semibold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Nama DPL */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                            {dpl.nama_lengkap?.charAt(0).toUpperCase() || 'D'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{dpl.nama_lengkap}</p>
                            <p className="text-xs text-slate-500 font-medium">{dpl.program_studi || 'STIMI YAPMI'}</p>
                          </div>
                        </div>
                      </td>

                      {/* NIDN */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-900/60 px-2 py-1 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {dpl.nidn || dpl.nim_nidn}
                        </span>
                      </td>

                      {/* Kontak */}
                      <td className="py-4 px-4">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{dpl.email || '-'}</p>
                        {dpl.nomor_hp ? (
                          <a 
                            href={`https://wa.me/${dpl.nomor_hp.replace(/^0/, '62').replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline mt-0.5"
                          >
                            <span>💬</span> {dpl.nomor_hp}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ada no HP</span>
                        )}
                      </td>

                      {/* Mahasiswa Bimbingan */}
                      <td className="py-4 px-4 text-center">
                        {dpl.total_mahasiswa > 0 ? (
                          <button
                            onClick={() => setSelectedDplStudents(dpl)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs"
                            title="Klik untuk melihat daftar mahasiswa bimbingan"
                          >
                            <span>👥</span> {dpl.total_mahasiswa} Mahasiswa
                          </button>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            Belum Ada
                          </span>
                        )}
                      </td>

                      {/* Tombol Utama: Masuk Sebagai DPL */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setImpersonatingDpl(dpl)}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-indigo-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer whitespace-nowrap"
                          title={`Login dan operasikan akun ${dpl.nama_lengkap}`}
                        >
                          <span>🔑</span> Masuk Sebagai DPL
                        </button>
                      </td>

                      {/* Aksi Edit & Hapus */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setForm({
                                id: dpl._id,
                                nama_lengkap: dpl.nama_lengkap || "",
                                nim_nidn: dpl.nim_nidn || "",
                                nidn: dpl.nidn || dpl.nim_nidn || "",
                                email: dpl.email || "",
                                nomor_hp: dpl.nomor_hp || "",
                                password: ""
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-xs text-blue-600 hover:text-blue-900 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data DPL"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleResetPassword(dpl)}
                            className="p-1.5 text-xs text-amber-600 hover:text-amber-900 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password ke NIDN"
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => handleDelete(dpl)}
                            className="p-1.5 text-xs text-red-600 hover:text-red-900 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                            title="Hapus DPL"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>

      {/* MODAL KONFIRMASI IMPERSONASI (MASUK SEBAGAI DPL) */}
      {impersonatingDpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-3">
              <span className="text-3xl">🔑</span>
              <div>
                <h3 className="text-lg font-black leading-tight">Konfirmasi Mode Bantuan DPL</h3>
                <p className="text-xs text-white/80">Masuk mewakili dosen tanpa password</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-blue-100 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dosen Target</p>
                <p className="text-base font-black text-slate-900 dark:text-slate-100">{impersonatingDpl.nama_lengkap}</p>
                <p className="text-xs text-slate-500 font-medium">NIDN: {impersonatingDpl.nidn || impersonatingDpl.nim_nidn}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Mahasiswa Bimbingan: {impersonatingDpl.total_mahasiswa} Orang</p>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900">
                <p className="font-bold text-amber-800 dark:text-amber-300">💡 Cara Kerja Mode Bantuan:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Sistem akan mengalihkan ruang kerja Anda ke akun DPL ini secara instan.</li>
                  <li>Anda dapat memvalidasi logbook, membuka laporan, dan mengisi evaluasi nilai.</li>
                  <li>Di bagian atas layar akan ada tombol oranye untuk <strong>kembali ke akun Admin kapan saja</strong>.</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                disabled={isProcessingLogin}
                onClick={() => setImpersonatingDpl(null)}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessingLogin}
                onClick={handleImpersonateConfirm}
                className="px-6 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isProcessingLogin ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mengalihkan Akun...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Masuk Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIHAT DAFTAR MAHASISWA BIMBINGAN */}
      {selectedDplStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Daftar Mahasiswa Bimbingan</h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{selectedDplStudents.nama_lengkap}</p>
              </div>
              <button onClick={() => setSelectedDplStudents(null)} className="text-slate-400 hover:text-red-400 font-bold text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
              {selectedDplStudents.mahasiswa_bimbingan?.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">Belum ada mahasiswa yang ditugaskan ke DPL ini.</p>
              ) : (
                selectedDplStudents.mahasiswa_bimbingan.map((mhs, i) => (
                  <div key={mhs.id || i} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{mhs.nama}</p>
                      <p className="text-xs text-slate-500 font-mono">NIM: {mhs.nim}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        🏢 {mhs.mitra}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold">Total: {selectedDplStudents.total_mahasiswa} Mahasiswa</span>
              <button onClick={() => setSelectedDplStudents(null)} className="px-4 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH DPL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Tambah DPL Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-red-400 font-bold text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dr. H. Mursalim, S.E., M.M."
                    value={form.nama_lengkap}
                    onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">NIDN / Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="0912345678"
                      value={form.nim_nidn}
                      onChange={(e) => setForm({ ...form, nim_nidn: e.target.value, nidn: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor WhatsApp</label>
                    <input
                      type="text"
                      placeholder="081234567890"
                      value={form.nomor_hp}
                      onChange={(e) => setForm({ ...form, nomor_hp: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="dosen@stimi-yapmi.ac.id"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password Awal (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Kosongkan untuk otomatis menggunakan NIDN"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">Default password adalah NIDN masing-masing.</p>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan DPL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT DPL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Edit Data DPL</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-red-400 font-bold text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={form.nama_lengkap}
                    onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">NIDN / Username *</label>
                    <input
                      type="text"
                      required
                      value={form.nim_nidn}
                      onChange={(e) => setForm({ ...form, nim_nidn: e.target.value, nidn: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={form.nomor_hp}
                      onChange={(e) => setForm({ ...form, nomor_hp: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
