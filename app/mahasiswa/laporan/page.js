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

  const DEFAULT_SECTIONS = {
    bab1: [
      { id: '1_1', title: '1.1 Latar Belakang', content: '' },
      { id: '1_2', title: '1.2 Tujuan Magang', content: '' },
      { id: '1_3', title: '1.3 Manfaat Magang', content: '' }
    ],
    bab2: [
      { id: '2_1', title: '2.1 Deskripsi & Sejarah Perusahaan', content: '' },
      { id: '2_2', title: '2.2 Visi dan Misi', content: '' },
      { id: '2_3', title: '2.3 Struktur Organisasi', content: '' },
      { id: '2_4', title: '2.4 Strategi Bisnis', content: '' },
      { id: '2_5', title: '2.5 Aspek Manajemen', content: '' },
      { id: '2_6', title: '2.6 Aspek Produksi / Operasional', content: '' },
      { id: '2_7', title: '2.7 Aspek Keuangan', content: '' },
      { id: '2_8', title: '2.8 Aspek Pemasaran', content: '' },
      { id: '2_9', title: '2.9 Aspek Sumber Daya Manusia', content: '' },
      { id: '2_10', title: '2.10 Lingkup Unit Kerja & Lokasi Kantor', content: '' }
    ],
    bab3: [
      { id: '3_1', title: '3.1 Lingkup Penugasan', content: '' },
      { id: '3_2', title: '3.2 Rencana dan Penjadwalan Kerja', content: '' },
      { id: '3_3', title: '3.3 Deskripsi Aktivitas Kegiatan Magang', content: '' }
    ],
    bab4: [
      { id: '4_1', title: '4.1 Latar Belakang Permasalahan', content: '' },
      { id: '4_2', title: '4.2 Dampak Masalah terhadap Penulis dan Tim', content: '' },
      { id: '4_3', title: '4.3 Solusi yang Dilakukan', content: '' }
    ],
    bab5: [
      { id: '5_1', title: '5.1 Kesimpulan', content: '' },
      { id: '5_2', title: '5.2 Saran & Rekomendasi untuk Perusahaan', content: '' },
      { id: '5_3', title: '5.3 Saran & Rekomendasi untuk Kampus / Calon Peserta', content: '' }
    ],
    bab6: [
      { id: '6_1', title: '6.1 Hal-hal Positif dan Manfaat yang Diterima', content: '' },
      { id: '6_2', title: '6.2 Hal-hal yang Menyadarkan terhadap Kekurangan Diri', content: '' }
    ]
  };

  const safeParse = (str, defaultObj) => {
    if (!str) return defaultObj;
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed;
      return defaultObj;
    } catch (e) {
      const fallback = JSON.parse(JSON.stringify(defaultObj));
      fallback[0].content = str;
      return fallback;
    }
  };

  const countWords = (sections) => {
    return sections.reduce((acc, curr) => {
      const text = (curr.content || '').trim();
      return acc + (text === '' ? 0 : text.split(/\s+/).length);
    }, 0);
  };

  const [formData, setFormData] = useState({
    bab1_sections: DEFAULT_SECTIONS.bab1,
    bab2_sections: DEFAULT_SECTIONS.bab2,
    bab3_sections: DEFAULT_SECTIONS.bab3,
    bab4_sections: DEFAULT_SECTIONS.bab4,
    bab5_sections: DEFAULT_SECTIONS.bab5,
    bab6_sections: DEFAULT_SECTIONS.bab6,
    file_pengantar: '',
    file_penerimaan: '',
    file_keterangan: '',
    file_struktur_organisasi: '',
    catatan_dpl: '',
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
          bab1_sections: safeParse(data.laporan.bab1_pendahuluan, DEFAULT_SECTIONS.bab1),
          bab2_sections: safeParse(data.laporan.bab2_profil, DEFAULT_SECTIONS.bab2),
          bab3_sections: safeParse(data.laporan.bab3_aktivitas, DEFAULT_SECTIONS.bab3),
          bab4_sections: safeParse(data.laporan.bab4_permasalahan, DEFAULT_SECTIONS.bab4),
          bab5_sections: safeParse(data.laporan.bab5_kesimpulan, DEFAULT_SECTIONS.bab5),
          bab6_sections: safeParse(data.laporan.bab6_refleksi, DEFAULT_SECTIONS.bab6),
          file_pengantar: data.laporan.file_pengantar || '',
          file_penerimaan: data.laporan.file_penerimaan || '',
          file_keterangan: data.laporan.file_keterangan || '',
          file_struktur_organisasi: data.laporan.file_struktur_organisasi || '',
          catatan_dpl: data.laporan.catatan_dpl || '',
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
      const payload = {
        mhsId: session.user.id,
        bab1_pendahuluan: JSON.stringify(formData.bab1_sections),
        bab2_profil: JSON.stringify(formData.bab2_sections),
        bab3_aktivitas: JSON.stringify(formData.bab3_sections),
        bab4_permasalahan: JSON.stringify(formData.bab4_sections),
        bab5_kesimpulan: JSON.stringify(formData.bab5_sections),
        bab6_refleksi: JSON.stringify(formData.bab6_sections),
        file_pengantar: formData.file_pengantar,
        file_penerimaan: formData.file_penerimaan,
        file_keterangan: formData.file_keterangan,
        file_struktur_organisasi: formData.file_struktur_organisasi,
        status: submitFinal ? 'submitted' : formData.status
      };

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
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-2xl border border-red-100 dark:border-red-900/50">
            <h3 className="font-bold text-lg mb-2">Akses Ditolak</h3>
            <p className="dark:text-red-300">Anda belum memiliki pengajuan magang yang aktif atau disetujui. Laporan Akhir belum dapat diakses.</p>
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
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center shadow-[0_20px_50px_rgb(0,0,0,0.05)] border border-slate-100 dark:border-slate-800">
            <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
              🔒
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-4">Halaman Terkunci</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Berdasarkan jadwal, kegiatan magang Anda baru akan berakhir pada <span className="font-bold text-blue-600 dark:text-blue-400">{new Date(pengajuan.tanggal_selesai).toLocaleDateString('id-ID')}</span>. 
              Sesuai peraturan, halaman Laporan Akhir & Sertifikat akan terbuka <span className="font-bold">14 hari sebelum</span> masa magang berakhir.
            </p>
            <div className="inline-block bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6 px-10">
              <div className="text-sm font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-2">Terbuka Dalam Waktu</div>
              <div className="text-5xl font-black text-blue-700 dark:text-blue-500">{daysRemaining} Hari</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Tampilan UNLOCKED (Form)
  return (
    <DashboardLayout title="Penyusunan Laporan Akhir">
      <div className="w-full space-y-6">

        {formData.status === 'submitted' && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-400 p-4 rounded-xl flex items-center gap-3">
            <div className="text-2xl">⏳</div>
            <div>
              <div className="font-bold">Menunggu Persetujuan DPL</div>
              <div className="text-sm">Laporan telah disubmit dan sedang diperiksa oleh DPL Anda. Anda tidak dapat mengubah isi laporan saat ini.</div>
            </div>
          </div>
        )}

        {formData.status === 'revisi' && (
          <div className="mb-8 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-400 p-4 rounded-xl flex items-start gap-3">
            <div className="text-2xl mt-1">❌</div>
            <div>
              <div className="font-bold">Laporan Perlu Direvisi</div>
              <div className="text-sm mb-2 text-rose-700 dark:text-rose-300">DPL Anda meminta Anda untuk melakukan revisi sebelum laporan dapat disetujui.</div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded border border-rose-100 dark:border-rose-900/50 text-sm italic font-medium">
                Catatan DPL: "{formData.catatan_dpl}"
              </div>
            </div>
          </div>
        )}

        {formData.status === 'disetujui' && (
          <div className="mb-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <div className="font-bold">Laporan Telah Disetujui DPL</div>
              <div className="text-sm">Laporan Akhir Anda telah disetujui. Anda sekarang dapat mencetak Laporan PDF.</div>
            </div>
          </div>
        )}

        {/* Tab Navigasi */}
        <div className="flex bg-white dark:bg-slate-900 rounded-t-2xl border-b border-slate-200 dark:border-slate-800 p-2 gap-2 shadow-sm flex-wrap">
          <button onClick={() => setActiveTab('panduan')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'panduan' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            📖 Panduan & Template
          </button>
          <button onClick={() => setActiveTab('bab')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'bab' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            📝 Isi Laporan (Bab I - VI)
          </button>
          <button onClick={() => setActiveTab('dokumen')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'dokumen' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            📎 Upload Surat Pendukung
          </button>
          <button onClick={() => setActiveTab('cetak')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'cetak' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            🖨️ Cetak & SKPI
          </button>
        </div>

        {/* Konten Tab */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-b-2xl shadow-sm border border-t-0 border-slate-200 dark:border-slate-800 min-h-[500px]">
          
          {/* TAB 0: PANDUAN */}
          {activeTab === 'panduan' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-2 mb-4">Sistematika Penulisan & Minimal Konten</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border dark:border-slate-800 p-4 rounded-xl">
                    <h4 className="font-bold dark:text-slate-100">BAB I. PENDAHULUAN</h4>
                    <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">Pada bab ini akan menguraikan tentang latar belakang dan tujuan penulis dalam memilih program magang, serta manfaat yang diterima oleh penulis, kampus dan perusahaan.</p>

                  </div>
                  <div className="border dark:border-slate-800 p-4 rounded-xl">
                    <h4 className="font-bold dark:text-slate-100">BAB II. PROFIL PERUSAHAAN</h4>
                    <p className="text-sm mt-2 text-slate-600 dark:text-slate-400 h-24 overflow-y-auto custom-scrollbar">Pada bab ini akan menguraikan tentang profil perusahaan, visi, misi dan tujuan perusahaan, strategi bisnis, aspek manajemen, aspek produksi, aspek keuangan, aspek pemasaran, aspek sumber daya manusia, lingkup unit kerja, dan lokasi kantor perusahaan.</p>

                  </div>
                  <div className="border dark:border-slate-800 p-4 rounded-xl">
                    <h4 className="font-bold dark:text-slate-100">BAB III. AKTIVITAS MAGANG</h4>
                    <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">Pada bab ini akan menguraikan tentang lingkup penugasan penulis, rencana dan penjadwalan kerja, serta deskripsi aktivitas harian yang dilakukan selama magang.</p>

                  </div>
                  <div className="border dark:border-slate-800 p-4 rounded-xl">
                    <h4 className="font-bold dark:text-slate-100">BAB IV. PERMASALAHAN & SOLUSI</h4>
                    <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">Pada bab ini akan menguraikan tentang masalah yang ditemukan penulis selama melaksanakan aktivitas magang, dimulai dari latar belakang, dampaknya terhadap penulis dan tim perusahaan serta solusi yang dilakukan oleh penulis.</p>

                  </div>
                  <div className="border dark:border-slate-800 p-4 rounded-xl">
                    <h4 className="font-bold dark:text-slate-100">BAB V. KESIMPULAN & REKOMENDASI</h4>
                    <p className="text-sm mt-2 text-slate-600 dark:text-slate-400 h-24 overflow-y-auto custom-scrollbar">Pada bab ini akan menguraikan tentang kesimpulan yang dapat diambil dari aktivitas magang, masalah-masalah, serta solusi yang ditemukan. Selain itu terdapat rekomendasi dari penulis kepada pihak perusahaan, calon peserta magang selanjutnya, serta pihak kampus agar program magang kedepan dapat berjalan lebih baik.</p>

                  </div>
                  <div className="border dark:border-slate-800 p-4 rounded-xl">
                    <h4 className="font-bold dark:text-slate-100">BAB VI. REFLEKSI DIRI</h4>
                    <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">Pada bab ini akan menguraikan hal-hal positif dan manfaat yang diterima oleh penulis serta hal-hal yang menyadarkan penulis terhadap kekurangan penulis selama melaksanakan aktivitas magang.</p>

                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-2 mb-4">Template & Referensi Dokumen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href={`/mahasiswa/laporan/templates/pengesahan?id=${laporan._id}`} target="_blank" className="flex items-center gap-3 p-4 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="text-3xl">✍️</div>
                    <div>
                      <div className="font-bold dark:text-slate-100">Lembar Pengesahan Laporan</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Template Cetak & TTD</div>
                    </div>
                  </Link>
                  <Link href={`/mahasiswa/laporan/templates/pengantar?id=${laporan._id}`} target="_blank" className="flex items-center gap-3 p-4 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="text-3xl">📨</div>
                    <div>
                      <div className="font-bold dark:text-slate-100">Surat Pengantar Magang</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Template Cetak & TTD</div>
                    </div>
                  </Link>
                  <Link href={`/mahasiswa/laporan/templates/penerimaan?id=${laporan._id}`} target="_blank" className="flex items-center gap-3 p-4 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="text-3xl">🤝</div>
                    <div>
                      <div className="font-bold dark:text-slate-100">Surat Penerimaan Magang</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Template Cetak & TTD</div>
                    </div>
                  </Link>
                  <Link href={`/mahasiswa/laporan/templates/keterangan?id=${laporan._id}`} target="_blank" className="flex items-center gap-3 p-4 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="text-3xl">🏅</div>
                    <div>
                      <div className="font-bold dark:text-slate-100">Surat Keterangan Selesai Magang</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Template Cetak & TTD</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ISI LAPORAN */}
          {activeTab === 'bab' && (
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">BAB I. Pendahuluan</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${countWords(formData.bab1_sections) >= 400 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {countWords(formData.bab1_sections)} / 400 Kata
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Pada bab ini akan menguraikan tentang latar belakang dan tujuan penulis dalam memilih program magang, serta manfaat yang diterima oleh penulis, kampus dan perusahaan.</p>
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {formData.bab1_sections.map((sec, idx) => (
                    <div key={sec.id}>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{sec.title}</label>
                      <textarea
                        disabled={['submitted', 'disetujui'].includes(formData.status)}
                        value={sec.content}
                        onChange={(e) => {
                          const newSecs = [...formData.bab1_sections];
                          newSecs[idx].content = e.target.value;
                          setFormData({...formData, bab1_sections: newSecs});
                        }}
                        className="w-full h-32 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={`Isi dari ${sec.title}...`}
                      ></textarea>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">BAB II. Profil Perusahaan</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${countWords(formData.bab2_sections) >= 400 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {countWords(formData.bab2_sections)} / 400 Kata
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Pada bab ini akan menguraikan tentang profil perusahaan, visi, misi dan tujuan perusahaan, strategi bisnis, aspek manajemen, aspek produksi, aspek keuangan, aspek pemasaran, aspek sumber daya manusia, lingkup unit kerja, dan lokasi kantor perusahaan.</p>
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {formData.bab2_sections.map((sec, idx) => (
                    <div key={sec.id}>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{sec.title}</label>
                      {sec.id === '2_3' && (
                        <div className="mb-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50 flex items-start gap-2">
                          <span className="text-base leading-none mt-0.5">ℹ️</span>
                          <div className="w-full">
                            <p className="mb-2">Anda juga dapat melampirkan <b>gambar/foto bagan struktur organisasi</b> (Opsional).</p>
                            <div className="flex items-center">
                              <input 
                                disabled={['submitted', 'disetujui'].includes(formData.status)} 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleFileChange(e, 'file_struktur_organisasi')} 
                                className="text-xs w-full max-w-xs file:cursor-pointer file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all" 
                              />
                              {formData.file_struktur_organisasi && <span className="ml-2 font-bold text-emerald-600 flex-shrink-0">✓ Tersimpan</span>}
                            </div>
                          </div>
                        </div>
                      )}
                      <textarea
                        disabled={['submitted', 'disetujui'].includes(formData.status)}
                        value={sec.content}
                        onChange={(e) => {
                          const newSecs = [...formData.bab2_sections];
                          newSecs[idx].content = e.target.value;
                          setFormData({...formData, bab2_sections: newSecs});
                        }}
                        className="w-full h-32 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={`Isi dari ${sec.title}...`}
                      ></textarea>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">BAB III. Aktivitas Magang</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${countWords(formData.bab3_sections) >= 400 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {countWords(formData.bab3_sections)} / 400 Kata
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Pada bab ini akan menguraikan tentang lingkup penugasan penulis, rencana dan penjadwalan kerja, serta deskripsi aktivitas harian yang dilakukan selama magang.</p>
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {formData.bab3_sections.map((sec, idx) => (
                    <div key={sec.id}>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{sec.title}</label>
                      <textarea
                        disabled={['submitted', 'disetujui'].includes(formData.status)}
                        value={sec.content}
                        onChange={(e) => {
                          const newSecs = [...formData.bab3_sections];
                          newSecs[idx].content = e.target.value;
                          setFormData({...formData, bab3_sections: newSecs});
                        }}
                        className="w-full h-40 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={`Isi dari ${sec.title}...`}
                      ></textarea>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">BAB IV. Permasalahan & Pembahasan Solusi</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${countWords(formData.bab4_sections) >= 400 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {countWords(formData.bab4_sections)} / 400 Kata
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Pada bab ini akan menguraikan tentang masalah yang ditemukan penulis selama melaksanakan aktivitas magang, dimulai dari latar belakang, dampaknya terhadap penulis dan tim perusahaan serta solusi yang dilakukan oleh penulis.</p>
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {formData.bab4_sections.map((sec, idx) => (
                    <div key={sec.id}>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{sec.title}</label>
                      <textarea
                        disabled={['submitted', 'disetujui'].includes(formData.status)}
                        value={sec.content}
                        onChange={(e) => {
                          const newSecs = [...formData.bab4_sections];
                          newSecs[idx].content = e.target.value;
                          setFormData({...formData, bab4_sections: newSecs});
                        }}
                        className="w-full h-32 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={`Isi dari ${sec.title}...`}
                      ></textarea>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">BAB V. Kesimpulan & Rekomendasi</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${countWords(formData.bab5_sections) >= 200 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {countWords(formData.bab5_sections)} / 200 Kata
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Pada bab ini akan menguraikan tentang kesimpulan yang dapat diambil dari aktivitas magang, masalah-masalah, serta solusi yang ditemukan. Selain itu terdapat rekomendasi dari penulis kepada pihak perusahaan, calon peserta magang selanjutnya, serta pihak kampus agar program magang kedepan dapat berjalan lebih baik.</p>
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {formData.bab5_sections.map((sec, idx) => (
                    <div key={sec.id}>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{sec.title}</label>
                      <textarea
                        disabled={['submitted', 'disetujui'].includes(formData.status)}
                        value={sec.content}
                        onChange={(e) => {
                          const newSecs = [...formData.bab5_sections];
                          newSecs[idx].content = e.target.value;
                          setFormData({...formData, bab5_sections: newSecs});
                        }}
                        className="w-full h-32 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={`Isi dari ${sec.title}...`}
                      ></textarea>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">BAB VI. Refleksi Diri</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${countWords(formData.bab6_sections) >= 200 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {countWords(formData.bab6_sections)} / 200 Kata
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Pada bab ini akan menguraikan hal-hal positif dan manfaat yang diterima oleh penulis serta hal-hal yang menyadarkan penulis terhadap kekurangan penulis selama melaksanakan aktivitas magang.</p>
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {formData.bab6_sections.map((sec, idx) => (
                    <div key={sec.id}>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{sec.title}</label>
                      <textarea
                        disabled={['submitted', 'disetujui'].includes(formData.status)}
                        value={sec.content}
                        onChange={(e) => {
                          const newSecs = [...formData.bab6_sections];
                          newSecs[idx].content = e.target.value;
                          setFormData({...formData, bab6_sections: newSecs});
                        }}
                        className="w-full h-40 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={`Isi dari ${sec.title}...`}
                      ></textarea>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD DOKUMEN */}
          {activeTab === 'dokumen' && (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-400 p-4 rounded-xl text-sm mb-6">
                <strong>Penting:</strong> Dokumen-dokumen di bawah ini wajib diunggah (format PDF/Foto maksimal 2MB) karena akan dijadikan lampiran resmi di halaman paling belakang Laporan Anda. Jika belum memiliki surat, Anda dapat mencetak template di tab <b>Panduan & Template</b>.
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">1. Surat Pengantar Magang (Telah di TTD)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Surat resmi dari kampus ke instansi di awal pengajuan.</p>
                <input disabled={['submitted', 'disetujui'].includes(formData.status)} type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'file_pengantar')} className="text-sm dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50" />
                {formData.file_pengantar && (
                  <div className="inline-flex items-center gap-3 ml-4 mt-2 sm:mt-0">
                    <span className="text-xs font-bold text-emerald-600">✓ Berkas Tersimpan</span>
                    <button 
                      onClick={() => {
                        if (formData.file_pengantar.startsWith('data:')) {
                          const w = window.open();
                          if(w) w.document.write(`<iframe src="${formData.file_pengantar}" style="border:0;width:100%;height:100%"></iframe>`);
                        } else {
                          window.open(`/api/view-file?path=${encodeURIComponent(formData.file_pengantar)}`, '_blank');
                        }
                      }}
                      className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800/50 inline-flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Lihat Dokumen
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">2. Surat Penerimaan Magang (Telah di TTD)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Surat balasan dari instansi bahwa Anda diterima.</p>
                <input disabled={['submitted', 'disetujui'].includes(formData.status)} type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'file_penerimaan')} className="text-sm dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50" />
                {formData.file_penerimaan && (
                  <div className="inline-flex items-center gap-3 ml-4 mt-2 sm:mt-0">
                    <span className="text-xs font-bold text-emerald-600">✓ Berkas Tersimpan</span>
                    <button 
                      onClick={() => {
                        if (formData.file_penerimaan.startsWith('data:')) {
                          const w = window.open();
                          if(w) w.document.write(`<iframe src="${formData.file_penerimaan}" style="border:0;width:100%;height:100%"></iframe>`);
                        } else {
                          window.open(`/api/view-file?path=${encodeURIComponent(formData.file_penerimaan)}`, '_blank');
                        }
                      }}
                      className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800/50 inline-flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Lihat Dokumen
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">3. Surat Keterangan Telah Magang (Telah di TTD)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Surat keterangan resmi di akhir dari instansi bahwa Anda telah selesai.</p>
                <input disabled={['submitted', 'disetujui'].includes(formData.status)} type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'file_keterangan')} className="text-sm dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50" />
                {formData.file_keterangan && (
                  <div className="inline-flex items-center gap-3 ml-4 mt-2 sm:mt-0">
                    <span className="text-xs font-bold text-emerald-600">✓ Berkas Tersimpan</span>
                    <button 
                      onClick={() => {
                        if (formData.file_keterangan.startsWith('data:')) {
                          const w = window.open();
                          if(w) w.document.write(`<iframe src="${formData.file_keterangan}" style="border:0;width:100%;height:100%"></iframe>`);
                        } else {
                          window.open(`/api/view-file?path=${encodeURIComponent(formData.file_keterangan)}`, '_blank');
                        }
                      }}
                      className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800/50 inline-flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Lihat Dokumen
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">4. Gambar Struktur Organisasi (Opsional)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Upload bagan struktur organisasi jika ada. Format: Gambar/Foto.</p>
                <input disabled={['submitted', 'disetujui'].includes(formData.status)} type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'file_struktur_organisasi')} className="text-sm dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50" />
                {formData.file_struktur_organisasi && (
                  <div className="inline-flex items-center gap-3 ml-4 mt-2 sm:mt-0">
                    <span className="text-xs font-bold text-emerald-600">✓ Gambar Tersimpan</span>
                    <button 
                      onClick={() => {
                        if (formData.file_struktur_organisasi.startsWith('data:')) {
                          const w = window.open();
                          if(w) w.document.write(`<iframe src="${formData.file_struktur_organisasi}" style="border:0;width:100%;height:100%"></iframe>`);
                        } else {
                          window.open(`/api/view-file?path=${encodeURIComponent(formData.file_struktur_organisasi)}`, '_blank');
                        }
                      }}
                      className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800/50 inline-flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Lihat Gambar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CETAK */}
          {activeTab === 'cetak' && (
            <div className="space-y-6">
              {formData.status !== 'disetujui' || !(pengajuan?.penilaian_dpl && pengajuan?.penilaian_dpl?.sistematika_laporan != null) ? (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 text-center">
                  <div className="text-4xl mb-3">⚠️</div>
                  <h3 className="font-bold text-lg">Dokumen Belum Bisa Dicetak</h3>
                  <p className="text-sm mt-1">Laporan akhir Anda harus berstatus <strong>Disetujui</strong> dan <strong>Proses Penilaian (Evaluasi Akhir DPL)</strong> harus sudah selesai sebelum dokumen dan sertifikat dapat dicetak.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:shadow-lg dark:hover:shadow-slate-800/50 transition-all text-center group bg-white dark:bg-slate-900">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📘</div>
                    <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 mb-2">Laporan Akhir (A4)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Dokumen lengkap Bab I - VI beserta lampiran surat dan foto logbook.</p>
                    <Link href={`/mahasiswa/laporan/cetak/laporan?id=${laporan._id}`} target="_blank" className="w-full block py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/30">
                      Download PDF
                    </Link>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:shadow-lg dark:hover:shadow-slate-800/50 transition-all text-center group bg-white dark:bg-slate-900">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎖️</div>
                    <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 mb-2">Sertifikat Mahasiswa</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sertifikat kelulusan magang dengan Validasi QR Code SKPI (Landscape).</p>
                    <Link href={`/mahasiswa/laporan/cetak/sertifikat-mahasiswa?id=${laporan._id}`} target="_blank" className="w-full block py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/30">
                      Download PDF
                    </Link>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:shadow-lg dark:hover:shadow-slate-800/50 transition-all text-center group bg-white dark:bg-slate-900">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📊</div>
                    <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 mb-2">SKPI (Diploma Supplement)</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Surat Keterangan Pendamping Ijazah & Rekap nilai kegiatan ber-QR Code.</p>
                    <Link href={`/mahasiswa/laporan/cetak/transkrip?id=${laporan._id}`} target="_blank" className="w-full block py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/30">
                      Download PDF
                    </Link>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:shadow-lg dark:hover:shadow-slate-800/50 transition-all text-center group bg-white dark:bg-slate-900">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🏢</div>
                    <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 mb-2">Sertifikat Perusahaan</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sertifikat penghargaan untuk pihak mitra dari pimpinan kampus (Landscape).</p>
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
        {!['submitted', 'disetujui'].includes(formData.status) && (
          <div className="mt-8 flex justify-end gap-4">
            <button onClick={() => handleSave(false)} disabled={isSaving} className="px-8 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm disabled:opacity-50">
              {isSaving ? 'Menyimpan...' : 'Simpan Draf'}
            </button>
            <button onClick={() => {
              if (confirm('Yakin ingin SUBMIT FINAL? Setelah ini laporan akan dibekukan dan dokumen dapat dicetak.')) {
                handleSave(true);
              }
            }} disabled={isSaving} className="px-8 py-3 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 dark:shadow-none disabled:opacity-50">
              Submit Final
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
