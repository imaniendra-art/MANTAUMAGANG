'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [periodes, setPeriodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form tambah periode
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPeriode, setNewPeriode] = useState({
    nama_periode: '',
    status_pendaftaran: 'Dibuka',
    batas_laporan: ''
  });

  // App Config
  const [config, setConfig] = useState({
    nama_institusi: '',
    nama_pejabat_pengesah: '',
    nidn_pejabat: '',
    jabatan_pejabat: '',
    logo_url: null,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPeriode, resConfig] = await Promise.all([
        fetch('/api/periode'),
        fetch('/api/config')
      ]);
      
      if (resPeriode.ok) setPeriodes(await resPeriode.json());
      if (resConfig.ok) {
        const configData = await resConfig.json();
        setConfig(configData);
      }
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

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const formData = new FormData();
      formData.append('nama_institusi', config.nama_institusi || '');
      formData.append('nama_pejabat_pengesah', config.nama_pejabat_pengesah || '');
      formData.append('nama_ketua_institusi', config.nama_ketua_institusi || '');
      formData.append('nidn_pejabat', config.nidn_pejabat || '');
      formData.append('jabatan_pejabat', config.jabatan_pejabat || '');
      formData.append('current_logo', config.logo_url || '');
      
      if (logoFile) formData.append('logo_url', logoFile);

      const res = await fetch('/api/config', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        alert("Konfigurasi berhasil disimpan!");
        const updatedConfig = await res.json();
        setConfig(updatedConfig.data);
        setLogoFile(null);
      } else {
        alert("Gagal menyimpan konfigurasi");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <DashboardLayout title="Pengaturan Sistem">
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Pengaturan Sistem</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Kelola periode magang dan konfigurasi pendaftaran.
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Manajemen Periode */}
          <div className="space-y-6">
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
          
          {/* Konfigurasi Institusi */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  🏛️ Identitas Institusi
                </h3>
              </div>
              
              <div className="p-5">
                {loading ? (
                  <p className="text-center text-sm text-slate-500 animate-pulse">Memuat konfigurasi...</p>
                ) : (
                  <form onSubmit={handleSaveConfig} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Institusi</label>
                      <input 
                        type="text" required 
                        value={config?.nama_institusi || ''} onChange={e => setConfig({...config, nama_institusi: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ketua Institusi</h4>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Ketua (Untuk Sertifikat)</label>
                        <input 
                          type="text" required
                          value={config?.nama_ketua_institusi || ''} onChange={e => setConfig({...config, nama_ketua_institusi: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Pejabat Pengesah (Kaprodi)</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Pejabat</label>
                          <input 
                            type="text" required
                            value={config?.nama_pejabat_pengesah || ''} onChange={e => setConfig({...config, nama_pejabat_pengesah: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIDN Pejabat</label>
                          <input 
                            type="text" required
                            value={config?.nidn_pejabat || ''} onChange={e => setConfig({...config, nidn_pejabat: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jabatan</label>
                        <input 
                          type="text" required placeholder="Cth: Ketua Program Studi"
                          value={config?.jabatan_pejabat || ''} onChange={e => setConfig({...config, jabatan_pejabat: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>


                    <button type="submit" disabled={savingConfig} className="w-full py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      {savingConfig ? 'Menyimpan...' : 'Simpan Identitas'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
          

        </div>
      </div>
    </DashboardLayout>
  );
}
