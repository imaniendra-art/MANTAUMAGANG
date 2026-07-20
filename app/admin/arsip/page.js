'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';

export default function ArsipPage() {
  const { data: session } = useSession();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pengajuan?admin=true&status=disetujui');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const searchStr = searchQuery.toLowerCase();
    const nama = item.mahasiswa_id?.nama_lengkap?.toLowerCase() || '';
    const nim = item.mahasiswa_id?.nim_nidn?.toLowerCase() || '';
    return nama.includes(searchStr) || nim.includes(searchStr);
  });

  return (
    <DashboardLayout title="Arsip & Dokumen">
      <div className="space-y-6">
        
        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="w-full md:w-auto">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Arsip & Dokumen</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Kelola dan unduh dokumen lampiran mahasiswa (CV, Laporan, Surat Pengantar).
            </p>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 shrink-0 relative">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                🔍
              </div>
              <input
                type="text"
                placeholder="Cari nama atau NIM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-900 font-medium text-sm text-slate-900 dark:text-white transition-all"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Memuat arsip dokumen...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredData.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 text-sm font-medium">
                Belum ada data dokumen.
              </div>
            ) : (
              filteredData.map((item) => {
                const mhs = item.mahasiswa_id || {};
                const mitra = item.mitra_id || item.posisi_id?.mitra_id || {};
                
                return (
                  <div key={item._id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{mhs.nama_lengkap || '-'}</h3>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{mhs.nim_nidn || '-'}</p>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-100 dark:border-indigo-800/50">
                        Arsip
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">CV & Portfolio</p>
                          <p className="text-[10px] text-slate-500">Berjalan di {mitra.nama_instansi || item.detail_tempat?.nama || '-'}</p>
                        </div>
                        {item.file_cv_path ? (
                          <a href={item.file_cv_path} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors">
                            Lihat Dokumen
                          </a>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 italic">Belum unggah</span>
                        )}
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Surat Pengantar Prodi</p>
                          <p className="text-[10px] text-slate-500">Otomatis di-generate dari sistem</p>
                        </div>
                        <button className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors">
                          Cetak Surat
                        </button>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Laporan Akhir (PDF)</p>
                          <p className="text-[10px] text-slate-500">{item.transkrip_final?.length > 0 ? 'Sudah Pleno' : 'Belum Final'}</p>
                        </div>
                        <button className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors">
                          Lihat Laporan
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
