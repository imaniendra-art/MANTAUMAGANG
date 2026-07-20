'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [paketMatkul, setPaketMatkul] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form tambah periode
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPeriode, setNewPeriode] = useState({
    nama_periode: '',
    status_pendaftaran: 'Dibuka',
    batas_laporan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPaket, resPeriode] = await Promise.all([
        fetch('/api/paket-matkul'),
        fetch('/api/periode')
      ]);
      
      if (resPaket.ok) setPaketMatkul(await resPaket.json());
      if (resPeriode.ok) setPeriodes(await resPeriode.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPeriode = async (e) => {
    e.preventDefault();
    if (!newPeriode.nama_periode) return alert("Nama periode wajib diisi!");

    try {
      const res = await fetch('/api/periode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPeriode)
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewPeriode({ nama_periode: '', status_pendaftaran: 'Dibuka', batas_laporan: '' });
        fetchData(); // reload
      } else {
        const error = await res.json();
        alert(error.error || "Gagal menambah periode");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
    }
  };

  const handleSetActive = async (id) => {
    if (!confirm("Aktifkan periode ini? Periode lain otomatis non-aktif.")) return;
    try {
      const res = await fetch('/api/periode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_active', id })
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Gagal set aktif");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus periode ini? Data tidak dapat dikembalikan!")) return;
    try {
      const res = await fetch(`/api/periode?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  const handleUpdateStatus = async (id, status_pendaftaran, batas_laporan) => {
    try {
      const res = await fetch('/api/periode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_data', id, status_pendaftaran, batas_laporan })
      });
      if (res.ok) {
        fetchData();
        alert("Pengaturan disimpan!");
      }
    } catch (error) {
      alert("Gagal update pengaturan");
    }
  };

  // Cari periode yang sedang aktif
  const activePeriode = periodes.find(p => p.is_active);

  return (
    <DashboardLayout title="Pengaturan Sistem">
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Pengaturan Sistem</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Kelola periode magang, konfigurasi pendaftaran, dan struktur paket mata kuliah MBKM.
            </p>
          </div>
          {activePeriode && (
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 px-5 py-3 rounded-xl flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">Periode Aktif</p>
                <p className="text-sm font-black text-indigo-900 dark:text-indigo-300">{activePeriode.nama_periode}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Kolom Kiri: Manajemen Periode */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  📅 Master Periode
                </h3>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
                >
                  {showAddForm ? 'Batal' : '+ Tambah'}
                </button>
              </div>

              {showAddForm && (
                <div className="p-5 border-b border-indigo-100 dark:border-slate-700 bg-indigo-50/50 dark:bg-slate-900/50 animate-in slide-in-from-top-2">
                  <form onSubmit={handleAddPeriode} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Periode (Tahun Ajaran)</label>
                      <input 
                        type="text" required placeholder="Cth: Ganjil 2026/2027"
                        value={newPeriode.nama_periode} onChange={e => setNewPeriode({...newPeriode, nama_periode: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Daftar</label>
                        <select 
                          value={newPeriode.status_pendaftaran} onChange={e => setNewPeriode({...newPeriode, status_pendaftaran: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option>Dibuka</option>
                          <option>Ditutup</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batas Laporan</label>
                        <input 
                          type="date"
                          value={newPeriode.batas_laporan} onChange={e => setNewPeriode({...newPeriode, batas_laporan: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700">
                      Simpan Periode
                    </button>
                  </form>
                </div>
              )}
              
              <div className="p-4 space-y-3">
                {loading && <p className="text-center text-sm text-slate-500 animate-pulse">Memuat...</p>}
                {!loading && periodes.length === 0 && <p className="text-center text-sm text-slate-500">Belum ada periode.</p>}
                
                {periodes.map(p => (
                  <div key={p._id} className={`p-4 rounded-xl border transition-all ${p.is_active ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          {p.nama_periode}
                          {p.is_active && <span className="px-2 py-0.5 bg-indigo-500 text-white text-[9px] uppercase tracking-wider font-black rounded">Aktif</span>}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Batas Laporan: {p.batas_laporan ? new Date(p.batas_laporan).toLocaleDateString('id-ID') : 'Belum diatur'}</p>
                      </div>
                      <div className="flex gap-2">
                        {!p.is_active && (
                          <button onClick={() => handleSetActive(p._id)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded">Aktifkan</button>
                        )}
                        <button onClick={() => handleDelete(p._id)} className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded">Hapus</button>
                      </div>
                    </div>
                    
                    {/* Jika aktif, tampilkan opsi edit pendaftaran */}
                    {p.is_active && (
                      <div className="pt-3 mt-3 border-t border-indigo-100 dark:border-indigo-800/50 flex gap-2 items-center">
                        <select 
                          className="flex-1 text-xs px-2 py-1.5 rounded border border-indigo-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                          value={p.status_pendaftaran}
                          onChange={(e) => handleUpdateStatus(p._id, e.target.value, p.batas_laporan)}
                        >
                          <option value="Dibuka">Pendaftaran Buka</option>
                          <option value="Ditutup">Pendaftaran Tutup</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Paket Mata Kuliah */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  📚 Paket Mata Kuliah MBKM
                </h3>
                <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors">
                  + Tambah Paket
                </button>
              </div>

              {loading ? (
                <div className="text-center py-10 text-slate-500 font-bold animate-pulse">Memuat data paket matkul...</div>
              ) : paketMatkul.length === 0 ? (
                <div className="text-center py-10 text-slate-500 font-medium">Belum ada paket mata kuliah yang dikonfigurasi.</div>
              ) : (
                <div className="space-y-4">
                  {paketMatkul.map(paket => (
                    <div key={paket._id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">{paket.nama_paket}</h4>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skema: {paket.jenis_skema}</span>
                        </div>
                        <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                          {paket.mata_kuliah?.length || 0} Matkul
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-800">
                        {paket.mata_kuliah && paket.mata_kuliah.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {paket.mata_kuliah.map(mk => (
                              <div key={mk._id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{mk.nama}</p>
                                  <p className="text-[10px] font-medium text-slate-500">{mk.kode}</p>
                                </div>
                                <span className="font-black text-slate-700 dark:text-slate-400">{mk.sks} SKS</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Belum ada mata kuliah dalam paket ini.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
