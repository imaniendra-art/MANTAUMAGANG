"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function LaporanAkhirPage() {
  const { data: session } = useSession();
  const [laporan, setLaporan] = useState(null);
  const [pengajuan, setPengajuan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [activeTab, setActiveTab] = useState('bab');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    bab1_pendahuluan: '',
    bab2_profil: '',
    bab3_aktivitas: '',
    bab4_permasalahan: '',
    bab5_kesimpulan: '',
    bab6_refleksi: '',
    file_pengantar: '',
    file_penerimaan: '',
    file_keterangan: '',
    status: 'draft'
  });

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/laporan-akhir?mhsId=${session.user.id}&_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLaporan(data.laporan);
      setPengajuan(data.pengajuan);

      if (data.laporan) {
        setFormData({
          bab1_pendahuluan: data.laporan.bab1_pendahuluan || '',
          bab2_profil: data.laporan.bab2_profil || '',
          bab3_aktivitas: data.laporan.bab3_aktivitas || '',
          bab4_permasalahan: data.laporan.bab4_permasalahan || '',
          bab5_kesimpulan: data.laporan.bab5_kesimpulan || '',
          bab6_refleksi: data.laporan.bab6_refleksi || '',
          file_pengantar: data.laporan.file_pengantar || '',
          file_penerimaan: data.laporan.file_penerimaan || '',
          file_keterangan: data.laporan.file_keterangan || '',
          status: data.laporan.status || 'draft'
        });
      }

      // Hitung Time-Lock
      const tglSelesai = new Date(data.pengajuan.tanggal_selesai);
      const openDate = new Date(tglSelesai);
      openDate.setDate(openDate.getDate() - 14); // Buka H-14
      const now = new Date();

      if (data.pengajuan.is_laporan_unlocked) {
        setIsLocked(false);
      } else if (now < openDate) {
        setIsLocked(true);
        const diffTime = Math.abs(openDate - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);
      } else {
        setIsLocked(false);
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id]);

  const handleSave = async (submitFinal = false) => {
    setIsSaving(true);
    try {
      const payload = { ...formData, mhsId: session.user.id };
      if (submitFinal) payload.status = 'submitted';

      const res = await fetch('/api/laporan-akhir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(submitFinal ? 'Laporan berhasil disubmit final!' : 'Draf berhasil disimpan!');
        fetchData();
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan.');
    }
    setIsSaving(false);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file maksimal 2MB");
        e.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <DashboardLayout title="Laporan & Sertifikat"><div className="p-8 text-center text-slate-500">Memuat data...</div></DashboardLayout>;

  if (!pengajuan) {
    return (
      <DashboardLayout title="Laporan & Sertifikat">
        <div className="p-8">
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100">
            <h3 className="font-bold text-lg mb-2">Akses Ditolak</h3>
            <p>Anda belum memiliki pengajuan magang yang aktif atau disetujui. Laporan Akhir belum dapat diakses.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Tampilan LOCK
  if (isLocked) {
    return (
      <DashboardLayout title="Laporan & Sertifikat">
        <div className="p-8 max-w-4xl mx-auto mt-10">
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-[0_20px_50px_rgb(0,0,0,0.05)] border border-slate-100">
            <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
              🔒
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4">Halaman Terkunci</h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Berdasarkan jadwal, kegiatan magang Anda baru akan berakhir pada <span className="font-bold text-blue-600">{new Date(pengajuan.tanggal_selesai).toLocaleDateString('id-ID')}</span>. 
              Sesuai peraturan, halaman Laporan Akhir & Sertifikat akan terbuka <span className="font-bold">14 hari sebelum</span> masa magang berakhir.
            </p>
            <div className="inline-block bg-blue-50 border border-blue-200 rounded-2xl p-6 px-10">
              <div className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2">Terbuka Dalam Waktu</div>
              <div className="text-5xl font-black text-blue-700">{daysRemaining} Hari</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Tampilan UNLOCKED (Form)
  return (
    <DashboardLayout title="Penyusunan Laporan Akhir">
      <div className="p-8 max-w-6xl mx-auto">

        {formData.status === 'submitted' && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <div className="font-bold">Laporan Telah Disubmit Final</div>
              <div className="text-sm">Anda tidak dapat lagi mengubah isi laporan. Laporan telah dibekukan untuk dicetak.</div>
            </div>
          </div>
        )}

        {/* Tab Navigasi */}
        <div className="flex bg-white rounded-t-2xl border-b border-slate-200 p-2 gap-2 shadow-sm flex-wrap">
          <button onClick={() => setActiveTab('bab')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'bab' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            📝 Isi Laporan (Bab I - VI)
          </button>
          <button onClick={() => setActiveTab('dokumen')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'dokumen' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            📎 Upload Surat Pendukung
          </button>
          <button onClick={() => setActiveTab('cetak')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'cetak' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            🖨️ Cetak & SKPI
          </button>
        </div>

        {/* Konten Tab */}
        <div className="bg-white p-8 rounded-b-2xl shadow-sm border border-t-0 border-slate-100 min-h-[500px]">
          
          {/* TAB 1: ISI LAPORAN */}
          {activeTab === 'bab' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">BAB I. Pendahuluan</h3>
                <p className="text-sm text-slate-500 mb-3">Tuliskan latar belakang dan tujuan magang Anda.</p>
                <textarea disabled={formData.status === 'submitted'} value={formData.bab1_pendahuluan} onChange={(e) => setFormData({...formData, bab1_pendahuluan: e.target.value})} className="w-full h-40 border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Ketik di sini..."></textarea>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">BAB II. Profil Perusahaan</h3>
                <p className="text-sm text-slate-500 mb-3">Jelaskan sejarah singkat, struktur, dan bidang usaha tempat magang.</p>
                <textarea disabled={formData.status === 'submitted'} value={formData.bab2_profil} onChange={(e) => setFormData({...formData, bab2_profil: e.target.value})} className="w-full h-40 border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Ketik di sini..."></textarea>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">BAB III. Aktivitas Magang</h3>
                <p className="text-sm text-slate-500 mb-3">Ceritakan secara naratif aktivitas utama Anda (Foto bukti akan otomatis ditarik dari logbook).</p>
                <textarea disabled={formData.status === 'submitted'} value={formData.bab3_aktivitas} onChange={(e) => setFormData({...formData, bab3_aktivitas: e.target.value})} className="w-full h-40 border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Ketik di sini..."></textarea>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">BAB IV. Permasalahan & Pembahasan</h3>
                <p className="text-sm text-slate-500 mb-3">Masalah apa yang Anda hadapi dan bagaimana solusinya?</p>
                <textarea disabled={formData.status === 'submitted'} value={formData.bab4_permasalahan} onChange={(e) => setFormData({...formData, bab4_permasalahan: e.target.value})} className="w-full h-40 border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Ketik di sini..."></textarea>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">BAB V. Kesimpulan & Rekomendasi</h3>
                <p className="text-sm text-slate-500 mb-3">Tuliskan kesimpulan program ini beserta rekomendasi untuk instansi dan kampus.</p>
                <textarea disabled={formData.status === 'submitted'} value={formData.bab5_kesimpulan} onChange={(e) => setFormData({...formData, bab5_kesimpulan: e.target.value})} className="w-full h-40 border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Ketik di sini..."></textarea>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">BAB VI. Refleksi Diri</h3>
                <p className="text-sm text-slate-500 mb-3">Pelajaran hidup dan wawasan baru apa yang Anda dapatkan secara personal?</p>
                <textarea disabled={formData.status === 'submitted'} value={formData.bab6_refleksi} onChange={(e) => setFormData({...formData, bab6_refleksi: e.target.value})} className="w-full h-40 border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Ketik di sini..."></textarea>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD DOKUMEN */}
          {activeTab === 'dokumen' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm mb-6">
                <strong>Penting:</strong> Dokumen-dokumen di bawah ini wajib diunggah (format PDF/Foto maksimal 2MB) karena akan dijadikan lampiran resmi di halaman paling belakang Laporan Anda.
              </div>

              <div className="border border-slate-200 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 mb-1">1. Surat Pengantar Magang</h4>
                <p className="text-xs text-slate-500 mb-4">Surat resmi dari kampus ke instansi di awal pengajuan.</p>
                <input disabled={formData.status === 'submitted'} type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'file_pengantar')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {formData.file_pengantar && <span className="ml-4 text-xs font-bold text-emerald-600">✓ Berkas Tersimpan</span>}
              </div>

              <div className="border border-slate-200 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 mb-1">2. Surat Penerimaan Magang</h4>
                <p className="text-xs text-slate-500 mb-4">Surat balasan dari instansi bahwa Anda diterima.</p>
                <input disabled={formData.status === 'submitted'} type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'file_penerimaan')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {formData.file_penerimaan && <span className="ml-4 text-xs font-bold text-emerald-600">✓ Berkas Tersimpan</span>}
              </div>

              <div className="border border-slate-200 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 mb-1">3. Surat Keterangan Telah Magang</h4>
                <p className="text-xs text-slate-500 mb-4">Surat keterangan resmi di akhir dari instansi (opsional tergantung mitra).</p>
                <input disabled={formData.status === 'submitted'} type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'file_keterangan')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {formData.file_keterangan && <span className="ml-4 text-xs font-bold text-emerald-600">✓ Berkas Tersimpan</span>}
              </div>
            </div>
          )}

          {/* TAB 3: CETAK */}
          {activeTab === 'cetak' && (
            <div className="space-y-6">
              {formData.status !== 'submitted' ? (
                <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 text-center">
                  <div className="text-4xl mb-3">⚠️</div>
                  <h3 className="font-bold text-lg">Dokumen Belum Bisa Dicetak</h3>
                  <p className="text-sm mt-1">Anda harus melakukan <strong>Submit Final</strong> terlebih dahulu sebelum sistem dapat membuat (generate) dokumen PDF Anda secara permanen dan menempelkan QR Code SKPI.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all text-center group bg-white">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📘</div>
                    <h3 className="font-black text-xl text-slate-800 mb-2">Laporan Akhir (A4)</h3>
                    <p className="text-sm text-slate-500 mb-6">Dokumen lengkap Bab I - VI beserta lampiran surat dan foto logbook.</p>
                    <Link href={`/mahasiswa/laporan/cetak/laporan?id=${laporan._id}`} target="_blank" className="w-full block py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/30">
                      Download PDF
                    </Link>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all text-center group bg-white">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎖️</div>
                    <h3 className="font-black text-xl text-slate-800 mb-2">Sertifikat Mahasiswa</h3>
                    <p className="text-sm text-slate-500 mb-6">Sertifikat kelulusan magang dengan Validasi QR Code SKPI (Landscape).</p>
                    <Link href={`/mahasiswa/laporan/cetak/sertifikat-mahasiswa?id=${laporan._id}`} target="_blank" className="w-full block py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/30">
                      Download PDF
                    </Link>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all text-center group bg-white">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📊</div>
                    <h3 className="font-black text-xl text-slate-800 mb-2">Transkrip Nilai SKS</h3>
                    <p className="text-sm text-slate-500 mb-6">Rekapan konversi nilai kegiatan dengan Validasi QR Code SKPI (A4).</p>
                    <Link href={`/mahasiswa/laporan/cetak/transkrip?id=${laporan._id}`} target="_blank" className="w-full block py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/30">
                      Download PDF
                    </Link>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all text-center group bg-white">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🏢</div>
                    <h3 className="font-black text-xl text-slate-800 mb-2">Sertifikat Perusahaan</h3>
                    <p className="text-sm text-slate-500 mb-6">Sertifikat penghargaan untuk pihak mitra dari pimpinan kampus (Landscape).</p>
                    <Link href={`/mahasiswa/laporan/cetak/sertifikat-mitra?id=${laporan._id}`} target="_blank" className="w-full block py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold shadow-md shadow-slate-500/30">
                      Download PDF
                    </Link>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        {/* Aksi Bawah */}
        {formData.status !== 'submitted' && (
          <div className="mt-8 flex justify-end gap-4">
            <button onClick={() => handleSave(false)} disabled={isSaving} className="px-8 py-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50">
              {isSaving ? 'Menyimpan...' : 'Simpan Draf'}
            </button>
            <button onClick={() => {
              if (confirm('Yakin ingin SUBMIT FINAL? Setelah ini laporan akan dibekukan dan dokumen dapat dicetak.')) {
                handleSave(true);
              }
            }} disabled={isSaving} className="px-8 py-3 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-50">
              Submit Final
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
