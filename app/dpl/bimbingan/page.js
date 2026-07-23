"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { UserCircle, MapPin, Phone, Mail, CheckCircle2, UserPlus, Clock, Printer, Lock, Unlock, Ban, Edit } from "lucide-react";

export default function DaftarBimbinganPage() {
  const [bimbinganList, setBimbinganList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedPengajuan, setSelectedPengajuan] = useState(null);
  const [mentorForm, setMentorForm] = useState({ nama_lengkap: '', nomor_hp: '', email: '' });
  const [assignToGroup, setAssignToGroup] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Modal State Reject
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/dpl/bimbingan?_t=${Date.now()}`);
      const data = await res.json();
      if (!data.error) setBimbinganList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleKonfirmasi = async (id) => {
    if (!confirm("Konfirmasi bahwa Anda telah menyerahkan mahasiswa ini ke instansi?")) return;
    try {
      const res = await fetch("/api/dpl/bimbingan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pengajuanId: id })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Gagal mengonfirmasi");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleLaporan = async (id, currentStatus) => {
    const actionText = currentStatus ? "mengunci kembali" : "membuka paksa";
    if (!confirm(`Apakah Anda yakin ingin ${actionText} akses laporan mahasiswa ini?`)) return;
    
    try {
      const res = await fetch("/api/dpl/toggle-laporan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pengajuanId: id, isUnlocked: !currentStatus })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Gagal mengubah status laporan");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem");
    }
  };

  const handleTolakInstansi = async (e) => {
    e.preventDefault();
    if (!selectedPengajuan || !rejectReason) return;
    
    setIsRejecting(true);
    try {
      const res = await fetch("/api/pengajuan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPengajuan._id,
          status_pengajuan: 'ditolak',
          alasan_penolakan: rejectReason
        })
      });
      
      if (res.ok) {
        setShowRejectModal(false);
        setRejectReason("");
        fetchData();
        alert("Mahasiswa telah ditandai sebagai Ditolak Instansi.");
      } else {
        const data = await res.json();
        alert("Gagal menolak: " + (data.error || ""));
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAddMentor = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/dpl/bimbingan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pengajuanId: selectedPengajuan._id,
          assignToGroup,
          ...mentorForm
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal mendaftarkan mentor");
      } else {
        setShowModal(false);
        setMentorForm({ nama_lengkap: '', nomor_hp: '', email: '' });
        fetchData();
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Daftar Bimbingan & Penyerahan" backPath="/dpl">
      <div className="space-y-6">
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center text-2xl shrink-0">
            ℹ️
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Informasi Penyerahan</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-4xl">
              Berikut adalah daftar mahasiswa bimbingan Anda yang pengajuan magangnya telah disetujui. Silakan tugaskan Mentor Lapangan saat Anda menyerahkan mahasiswa ke instansi, lalu tekan tombol <strong>Konfirmasi Penyerahan</strong> agar mahasiswa dapat memulai pencatatan logbook hariannya.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 dark:bg-slate-800/50 animate-pulse rounded-2xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800/50 animate-pulse rounded-2xl"></div>
          </div>
        ) : bimbinganList.length === 0 ? (
          <div className="text-center py-20 bg-white/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">Belum ada mahasiswa bimbingan yang disetujui.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 w-10 text-center">No</th>
                    <th className="px-6 py-4">NIM</th>
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">No HP</th>
                    <th className="px-6 py-4">Lokasi Magang</th>
                    <th className="px-6 py-4">Mentor Lapangan</th>
                    <th className="px-6 py-4">Perkiraan Waktu Penarikan</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {bimbinganList.map((item, index) => {
                    const mhs = item.mahasiswa_id;
                    const mentor = item.mentor_id;
                    const lokasi = item.posisi_id?.mitra_id?.nama_instansi || item.mitra_id?.nama_instansi || item.detail_tempat?.nama || "-";
                    
                    return (
                      <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-center">{index + 1}</td>
                        <td className="px-6 py-4 font-mono text-xs">{mhs?.nim_nidn}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{mhs?.nama_lengkap}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                            <Phone className="w-3 h-3" /> {mhs?.nomor_hp || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-1.5 max-w-[200px]">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <span className="font-medium line-clamp-2 leading-relaxed">{lokasi}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {mentor ? (
                            <div className="group relative pr-6">
                              <p className="font-bold text-slate-800 dark:text-slate-100">{mentor.nama_lengkap}</p>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                                <Phone className="w-3 h-3" /> {mentor.nomor_hp}
                              </div>
                              <button 
                                onClick={() => { 
                                  setSelectedPengajuan(item); 
                                  setMentorForm({
                                    nama_lengkap: mentor.nama_lengkap,
                                    nomor_hp: mentor.nomor_hp,
                                    email: mentor.email || ''
                                  });
                                  setShowModal(true); 
                                }}
                                className="absolute right-0 top-1 p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700"
                                title="Edit/Ganti Mentor"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => { setSelectedPengajuan(item); setShowModal(true); }}
                              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
                            >
                              <UserPlus className="w-3 h-3" /> Tugaskan Mentor
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.is_dpl_confirmed && item.tanggal_selesai ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {new Date(item.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                Mulai: {new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum diserahkan</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle text-center">
                          <div className="flex flex-row flex-nowrap items-center justify-center gap-2 w-max mx-auto">
                            <a 
                              href={`/mahasiswa/laporan/templates/pengantar?pengajuanId=${item._id}`}
                              target="_blank"
                              className="p-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20 border border-sky-200 dark:border-sky-500/30 transition-all"
                              title="Cetak Surat Pengantar"
                            >
                              <Printer className="w-4 h-4" />
                            </a>
                            
                            {item.is_dpl_confirmed ? (
                              <>
                                <span className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-500/30 cursor-help" title="Terkonfirmasi">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              
                                <button
                                  onClick={() => handleToggleLaporan(item._id, item.is_laporan_unlocked)}
                                  className={`p-2 rounded-lg border transition-all ${
                                    item.is_laporan_unlocked
                                      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400"
                                      : "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400"
                                  }`}
                                  title={item.is_laporan_unlocked ? "Kunci Laporan" : "Buka Laporan"}
                                >
                                  {item.is_laporan_unlocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 cursor-help" title="Menunggu Penyerahan">
                                  <Clock className="w-4 h-4" />
                                </span>
                                <button 
                                  onClick={() => handleKonfirmasi(item._id)}
                                  disabled={!mentor}
                                  className={`p-2 rounded-lg transition-all ${
                                    mentor 
                                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" 
                                      : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                                  }`}
                                  title={!mentor ? "Tugaskan mentor terlebih dahulu untuk mengonfirmasi penyerahan" : "Konfirmasi penyerahan"}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                
                                <button 
                                  onClick={() => { setSelectedPengajuan(item); setShowRejectModal(true); }}
                                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 transition-all"
                                  title="Tandai ditolak jika instansi menolak mahasiswa"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add Mentor */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Tugaskan Mentor Lapangan</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Buatkan akun untuk perwakilan instansi yang akan menjadi mentor. Mereka bisa login menggunakan <strong>Nomor HP</strong> sebagai password default.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-200">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddMentor} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap Mentor *</label>
                <input 
                  type="text" 
                  required
                  value={mentorForm.nama_lengkap}
                  onChange={e => setMentorForm({...mentorForm, nama_lengkap: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Cth: Budi Santoso"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nomor HP/WhatsApp *</label>
                <input 
                  type="text" 
                  required
                  value={mentorForm.nomor_hp}
                  onChange={e => setMentorForm({...mentorForm, nomor_hp: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Cth: 08123456789 (Digunakan sbg login & password)"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email (Opsional)</label>
                <input 
                  type="email" 
                  value={mentorForm.email}
                  onChange={e => setMentorForm({...mentorForm, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="budi@perusahaan.com"
                />
              </div>

              <div className="flex items-start gap-3 mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                <input 
                  type="checkbox" 
                  id="assignToGroup"
                  checked={assignToGroup}
                  onChange={e => setAssignToGroup(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="assignToGroup" className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer">
                  Terapkan mentor ini secara otomatis untuk <strong>seluruh mahasiswa bimbingan saya</strong> yang magang di lokasi instansi yang sama.
                </label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan & Tugaskan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Penolakan Instansi */}
      {showRejectModal && selectedPengajuan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl shrink-0">
                🚫
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ditolak Instansi</h2>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Apakah Anda yakin ingin mengembalikan status <strong>{selectedPengajuan.mahasiswa_id?.nama_lengkap}</strong> menjadi ditolak? Mahasiswa akan dapat mengajukan ulang ke lokasi magang lain.
            </p>

            <form onSubmit={handleTolakInstansi} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Alasan Penolakan (Wajib)</label>
                <textarea 
                  required
                  rows="3"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 text-sm leading-relaxed"
                  placeholder="Cth: Ditolak instansi karena kuota anak magang bulan ini sudah penuh..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowRejectModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isRejecting || !rejectReason.trim()}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isRejecting ? "Memproses..." : "Ya, Tolak Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
