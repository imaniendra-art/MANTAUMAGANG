'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import * as XLSX from 'xlsx';

export default function RekapitulasiPage() {
  const { data: session } = useSession();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

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

  const handleExportExcel = () => {
    if (data.length === 0) return;

    // Kumpulkan semua nama mata kuliah unik yang ada di transkrip final
    const courseSet = new Set();
    data.forEach(item => {
      if (item.transkrip_final && item.transkrip_final.length > 0) {
        item.transkrip_final.forEach(mk => {
          courseSet.add(mk.nama_mk);
        });
      }
    });
    const courseList = Array.from(courseSet);

    // Buat data untuk Excel
    const excelData = data.map((item, index) => {
      const mhs = item.mahasiswa_id || {};
      const row = { 
        "No": index + 1,
        "NIM": mhs.nim_nidn || '-',
        "Nama Mahasiswa": mhs.nama_lengkap || '-' 
      };

      // Isi nilai untuk setiap mata kuliah
      if (item.transkrip_final && item.transkrip_final.length > 0) {
        const gradeMap = {};
        let totalSks = 0;
        let totalNilai = 0;
        
        item.transkrip_final.forEach(mk => {
          gradeMap[mk.nama_mk] = {
            angka: mk.nilai_angka,
            huruf: mk.nilai_huruf
          };
          totalSks += mk.sks;
          totalNilai += (mk.nilai_angka * mk.sks);
        });
        
        courseList.forEach(course => {
          row[`${course} (Angka)`] = gradeMap[course]?.angka ?? '-';
          row[`${course} (Huruf)`] = gradeMap[course]?.huruf ?? '-';
        });

        row["Rata-Rata Nilai Akhir"] = totalSks > 0 ? (totalNilai / totalSks).toFixed(2) : '-';
      } else {
        // Belum dinilai / belum dikunci
        courseList.forEach(course => {
          row[`${course} (Angka)`] = '-';
          row[`${course} (Huruf)`] = '-';
        });
        row["Rata-Rata Nilai Akhir"] = '-';
      }

      return row;
    });

    // Generate Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekapitulasi Nilai");
    XLSX.writeFile(workbook, `Rekapitulasi_Nilai_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredData = data.filter(item => {
    const searchStr = searchQuery.toLowerCase();
    const nama = item.mahasiswa_id?.nama_lengkap?.toLowerCase() || '';
    const nim = item.mahasiswa_id?.nim_nidn?.toLowerCase() || '';
    return nama.includes(searchStr) || nim.includes(searchStr);
  });

  return (
    <DashboardLayout title="Rekapitulasi Nilai">
      <div className="space-y-6">
        
        {/* Header & Search */}
        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="w-full md:w-auto">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Rekapitulasi Nilai Akhir</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Pantau progres evaluasi DPL & Mentor, serta unduh rekapitulasi nilai.
            </p>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 shrink-0 relative">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                🔍
              </div>
              <input
                type="text"
                placeholder="Cari nama atau NIM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-slate-50 dark:bg-slate-900 font-medium text-sm text-slate-900 dark:text-white transition-all"
              />
            </div>
            <button 
              onClick={handleExportExcel}
              disabled={data.length === 0}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>📥</span> Export Excel
            </button>
          </div>
        </div>

        {/* Table Card */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Memuat data rekapitulasi...</div>
        ) : (
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 whitespace-nowrap">Mahasiswa</th>
                    <th className="py-4 px-6">Lokasi / Mitra</th>
                    <th className="py-4 px-6">DPL & Mentor</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500 text-sm font-medium">
                        Tidak ada data yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      const mhs = item.mahasiswa_id || {};
                      const posisi = item.posisi_id || {};
                      const mitra = item.mitra_id || posisi.mitra_id || {};
                      const dpl = item.dpl_id || {};
                      const mentor = item.mentor_id || {};

                      const hasNilaiMentor = !!item.penilaian_mentor?.kedisiplinan;
                      const hasNilaiDPL = !!item.penilaian_dpl?.kualitas_isi;
                      const isLocked = item.transkrip_final && item.transkrip_final.length > 0;

                      let statusBadge = <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">Belum Dinilai</span>;
                      if (isLocked) {
                        statusBadge = <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">Final (Terkunci)</span>;
                      } else if (hasNilaiMentor && hasNilaiDPL) {
                        statusBadge = <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">Siap Pleno</span>;
                      } else if (hasNilaiMentor) {
                        statusBadge = <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">Dinilai Mentor</span>;
                      } else if (hasNilaiDPL) {
                        statusBadge = <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">Dinilai DPL</span>;
                      }

                      return (
                        <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="py-4 px-6 align-top">
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{mhs.nama_lengkap || '-'}</p>
                            <p className="text-xs font-medium text-slate-500">{mhs.nim_nidn || '-'}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{mhs.program_studi || '-'} - {mhs.konsentrasi || '-'}</p>
                          </td>
                          <td className="py-4 px-6 align-top">
                            <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{mitra.nama_instansi || item.detail_tempat?.nama || '-'}</p>
                            <p className="text-xs text-slate-500">{posisi.nama_posisi || item.detail_tempat?.posisi || '-'}</p>
                          </td>
                          <td className="py-4 px-6 align-top">
                            <div className="space-y-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">DPL</span>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  {dpl.nama_lengkap ? dpl.nama_lengkap : <span className="italic text-slate-400">Belum di-plot</span>}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Mentor</span>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  {mentor.nama_lengkap ? mentor.nama_lengkap : <span className="italic text-slate-400">Belum di-plot</span>}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 align-middle text-center">
                            {statusBadge}
                          </td>
                          <td className="py-4 px-6 align-middle text-center">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors"
                            >
                              Detail
                            </button>
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

      {/* Modal Detail Nilai */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div>
                <h3 className="font-black text-xl text-slate-900 dark:text-white">Detail Evaluasi</h3>
                <p className="text-sm font-medium text-slate-500">{selectedItem.mahasiswa_id?.nama_lengkap}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Komponen Nilai Mentor */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Penilaian Mentor Industri</h4>
                </div>
                <div className="p-4">
                  {!selectedItem.penilaian_mentor?.kedisiplinan ? (
                    <p className="text-sm text-slate-500 italic">Mentor belum memberikan penilaian.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Kedisiplinan & Etika</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.penilaian_mentor.kedisiplinan}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Tanggung Jawab Pekerjaan</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.penilaian_mentor.tanggung_jawab}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Komunikasi & Kerjasama</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.penilaian_mentor.komunikasi_tim}</span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Catatan Mentor</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                          {selectedItem.penilaian_mentor.catatan || '-'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Komponen Nilai DPL */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Penilaian Akademik (DPL)</h4>
                </div>
                <div className="p-4">
                  {!selectedItem.penilaian_dpl?.kualitas_isi ? (
                    <p className="text-sm text-slate-500 italic">DPL belum memberikan penilaian pleno.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Sistematika Laporan</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.penilaian_dpl.sistematika_laporan}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Kualitas Isi & Analisis</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.penilaian_dpl.kualitas_isi}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Penguasaan Materi (Pleno)</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.penilaian_dpl.penguasaan_materi}</span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Catatan DPL</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                          {selectedItem.penilaian_dpl.catatan || '-'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transkrip Final */}
              {selectedItem.transkrip_final && selectedItem.transkrip_final.length > 0 && (
                <div className="border border-purple-200 dark:border-purple-900/50 rounded-2xl overflow-hidden bg-purple-50/30 dark:bg-purple-900/10">
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-4 border-b border-purple-100 dark:border-purple-900/50 flex justify-between items-center">
                    <h4 className="font-bold text-purple-800 dark:text-purple-300">Hasil Konversi SKS (Final)</h4>
                    <span className="px-2 py-1 bg-purple-600 text-white text-[10px] font-bold rounded">TERKUNCI</span>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                          <th className="pb-2 font-semibold">Kode</th>
                          <th className="pb-2 font-semibold">Mata Kuliah</th>
                          <th className="pb-2 text-center font-semibold">SKS</th>
                          <th className="pb-2 text-center font-semibold">Nilai</th>
                          <th className="pb-2 text-center font-semibold">Huruf</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {selectedItem.transkrip_final.map((mk, idx) => (
                          <tr key={idx}>
                            <td className="py-2 text-slate-600 dark:text-slate-400">{mk.kode_mk}</td>
                            <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{mk.nama_mk}</td>
                            <td className="py-2 text-center text-slate-600 dark:text-slate-400">{mk.sks}</td>
                            <td className="py-2 text-center font-bold text-slate-800 dark:text-slate-200">{mk.nilai_angka}</td>
                            <td className="py-2 text-center font-black text-purple-600 dark:text-purple-400">{mk.nilai_huruf}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
