'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import * as XLSX from 'xlsx';

export default function SinkronisasiPage() {
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
        // Filter out students who don't have a final locked transcript
        const lockedData = result.filter(item => item.transkrip_final && item.transkrip_final.length > 0);
        setData(lockedData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportNeoFeeder = () => {
    if (data.length === 0) return;

    // Neo Feeder expects rows per course, not just per student
    const excelData = [];
    
    data.forEach(item => {
      const mhs = item.mahasiswa_id || {};
      
      if (item.transkrip_final && item.transkrip_final.length > 0) {
        item.transkrip_final.forEach(mk => {
          excelData.push({
            "NIM": mhs.nim_nidn || '-',
            "Nama Mahasiswa": mhs.nama_lengkap || '-',
            "Kode Mata Kuliah": mk.kode_mk || '-',
            "Nama Mata Kuliah": mk.nama_mk || '-',
            "SKS": mk.sks || 0,
            "Nilai Angka": mk.nilai_angka || 0,
            "Nilai Huruf": mk.nilai_huruf || '-'
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Format Feeder PDDikti");
    XLSX.writeFile(workbook, `PDDikti_Feeder_Magang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredData = data.filter(item => {
    const searchStr = searchQuery.toLowerCase();
    const nama = item.mahasiswa_id?.nama_lengkap?.toLowerCase() || '';
    const nim = item.mahasiswa_id?.nim_nidn?.toLowerCase() || '';
    return nama.includes(searchStr) || nim.includes(searchStr);
  });

  return (
    <DashboardLayout title="Sinkronisasi PDDikti">
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="w-full md:w-auto">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Sinkronisasi PDDikti</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Unduh transkrip mahasiswa yang sudah <span className="font-bold text-slate-700 dark:text-slate-300">Terkunci (Final)</span> sesuai format impor Excel Neo Feeder PDDikti.
            </p>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 shrink-0 relative">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                🔍
              </div>
              <input
                type="text"
                placeholder="Cari mahasiswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-900 font-medium text-sm text-slate-900 dark:text-white transition-all"
              />
            </div>
            <button 
              onClick={handleExportNeoFeeder}
              disabled={data.length === 0}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>🔄</span> Download Format Feeder
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-5 rounded-2xl flex gap-4">
          <div className="text-blue-500 text-xl">ℹ️</div>
          <div>
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">Hanya Data Terkunci (Final)</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Tabel ini hanya menampilkan mahasiswa yang proses penilaiannya sudah selesai (di-pleno oleh DPL) dan SKS-nya telah dikonversi secara final. Jika ada mahasiswa yang tidak muncul, pastikan mereka sudah dinilai oleh Mentor & DPL di menu Evaluasi.
            </p>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Menyiapkan data sinkronisasi...</div>
        ) : (
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siap Sinkronisasi</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{data.length} Mahasiswa</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 whitespace-nowrap">Mahasiswa</th>
                    <th className="py-4 px-6">Total SKS</th>
                    <th className="py-4 px-6">IPK Konversi</th>
                    <th className="py-4 px-6 text-center">Format Baris Feeder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 text-sm font-medium">
                        Belum ada data mahasiswa yang terkunci.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      const mhs = item.mahasiswa_id || {};
                      
                      const totalSks = item.transkrip_final.reduce((acc, curr) => acc + curr.sks, 0);
                      const totalNilai = item.transkrip_final.reduce((acc, curr) => acc + (curr.nilai_angka * curr.sks), 0);
                      const ipk = totalSks > 0 ? (totalNilai / totalSks).toFixed(2) : 0;
                      const rowsFeeder = item.transkrip_final.length;

                      return (
                        <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-6 align-middle">
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{mhs.nama_lengkap || '-'}</p>
                            <p className="text-xs font-medium text-slate-500">{mhs.nim_nidn || '-'}</p>
                          </td>
                          <td className="py-4 px-6 align-middle">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{totalSks} SKS</span>
                          </td>
                          <td className="py-4 px-6 align-middle">
                            <span className="font-bold text-slate-900 dark:text-white">{ipk}</span>
                          </td>
                          <td className="py-4 px-6 align-middle text-center">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-600">
                              {rowsFeeder} Baris Excel
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
