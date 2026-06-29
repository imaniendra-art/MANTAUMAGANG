"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function MasterData() {
  const [activeTab, setActiveTab] = useState("mitra"); // 'mitra' | 'kurikulum'
  
  // Data State
  const [mitras, setMitras] = useState([]);
  const [pakets, setPakets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [showMitraModal, setShowMitraModal] = useState(false);
  const [showAddMatkulModal, setShowAddMatkulModal] = useState(false);
  const [showEditMatkulModal, setShowEditMatkulModal] = useState(false);
  const [showAddCpmkModal, setShowAddCpmkModal] = useState(false);
  const [showAddIndikatorModal, setShowAddIndikatorModal] = useState(false);
  
  const [selectedMatkul, setSelectedMatkul] = useState(null);
  const [selectedCPMK, setSelectedCPMK] = useState(null);
  
  // Toast State
  const [toastMessage, setToastMessage] = useState("");

  // Form State
  const [mitraForm, setMitraForm] = useState({ id: null, nama_instansi: "", jenis_skema: "Corporate", alamat: "", deskripsi_mitra: "" });
  
  // Posisi State
  const [showKelolaPosisiModal, setShowKelolaPosisiModal] = useState(false);
  const [selectedMitraForPosisi, setSelectedMitraForPosisi] = useState(null);
  const [posisiList, setPosisiList] = useState([]);
  const [showPosisiFormModal, setShowPosisiFormModal] = useState(false);
  const [posisiForm, setPosisiForm] = useState({ 
    id: null, nama_posisi: "", konsentrasi: "SDM", kuota: 1, 
    deskripsi_pekerjaan: "", kriteria_kandidat: "", sistem_kerja: "WFO" 
  });
  const [matkulForm, setMatkulForm] = useState({ kode: "", nama: "", sks: 3 });
  const [cpmkForm, setCpmkForm] = useState({ nama_cpmk: "" });
  const [indikatorForm, setIndikatorForm] = useState({ indikator: "" });

  // Pagination State for Mitra
  const [currentPageMitra, setCurrentPageMitra] = useState(1);
  const itemsPerPage = 8;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mitraRes, paketRes] = await Promise.all([
        fetch('/api/mitra'),
        fetch('/api/paket-matkul')
      ]);
      const mitraData = await mitraRes.json();
      const paketData = await paketRes.json();
      
      if (Array.isArray(mitraData)) setMitras(mitraData);
      if (Array.isArray(paketData)) setPakets(paketData);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleMitraSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = '/api/mitra';
      const method = mitraForm.id ? 'PATCH' : 'POST';
      const body = {
        nama_instansi: mitraForm.nama_instansi,
        jenis_skema: mitraForm.jenis_skema.toLowerCase(),
        alamat: mitraForm.alamat,
        deskripsi_mitra: mitraForm.deskripsi_mitra
      };
      if (mitraForm.id) body.id = mitraForm.id;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowMitraModal(false);
        setMitraForm({ id: null, nama_instansi: "", jenis_skema: "Corporate", alamat: "", deskripsi_mitra: "" });
        showToast(mitraForm.id ? "Data Mitra berhasil diperbarui!" : "Data Mitra berhasil disimpan!");
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteMitra = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus Mitra ini? Semua posisi magang yang terkait akan ikut terhapus!")) return;
    try {
      const res = await fetch(`/api/mitra?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Mitra berhasil dihapus!");
        fetchData();
      }
    } catch (error) { console.error(error); }
  };

  // Posisi Handlers
  const fetchPosisi = async (mitraId) => {
    try {
      const res = await fetch(`/api/posisi?mitraId=${mitraId}`);
      if (res.ok) {
        const data = await res.json();
        setPosisiList(data);
      }
    } catch (error) { console.error("Gagal fetch posisi", error); }
  };

  const handleOpenKelolaPosisi = (mitra) => {
    setSelectedMitraForPosisi(mitra);
    fetchPosisi(mitra._id);
    setShowKelolaPosisiModal(true);
  };

  const handlePosisiSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = '/api/posisi';
      const method = posisiForm.id ? 'PATCH' : 'POST';
      const body = { ...posisiForm, mitra_id: selectedMitraForPosisi._id };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowPosisiFormModal(false);
        setPosisiForm({ id: null, nama_posisi: "", konsentrasi: "SDM", kuota: 1, deskripsi_pekerjaan: "", kriteria_kandidat: "", sistem_kerja: "WFO" });
        showToast(posisiForm.id ? "Posisi berhasil diperbarui!" : "Posisi berhasil ditambahkan!");
        fetchPosisi(selectedMitraForPosisi._id);
      }
    } catch (error) { console.error(error); }
  };

  const handleDeletePosisi = async (id) => {
    if (!window.confirm("Hapus posisi magang ini?")) return;
    try {
      const res = await fetch(`/api/posisi?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Posisi berhasil dihapus!");
        fetchPosisi(selectedMitraForPosisi._id);
      }
    } catch (error) { console.error(error); }
  };

  const handleMatkulSubmit = async (e) => {
    e.preventDefault();
    try {
      const paketId = pakets[0]?._id;
      if (!paketId) return showToast("Paket utama tidak ditemukan");
      const res = await fetch('/api/paket-matkul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_matkul', paketId, ...matkulForm })
      });
      if (res.ok) {
        setShowAddMatkulModal(false);
        setMatkulForm({ kode: "", nama: "", sks: 3 });
        showToast("Mata Kuliah berhasil ditambahkan!");
        fetchData();
      }
    } catch (error) { console.error(error); }
  };

  const handleEditMatkulSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMatkul) return;
    try {
      const res = await fetch('/api/paket-matkul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_matkul',
          paketId: selectedMatkul.paketId,
          matkulId: selectedMatkul.matkulId,
          ...matkulForm
        })
      });
      if (res.ok) {
        setShowEditMatkulModal(false);
        setMatkulForm({ kode: "", nama: "", sks: 3 });
        showToast("Mata Kuliah berhasil diperbarui!");
        fetchData();
      }
    } catch (error) { console.error(error); }
  };

  // Dynamic form handlers for CPMK & Indikator
  const handleAddCpmkField = () => {
    setMatkulForm(prev => ({
      ...prev,
      cpmk: [...(prev.cpmk || []), { nama_cpmk: "", indikator: [] }]
    }));
  };

  const handleUpdateCpmkField = (index, value) => {
    setMatkulForm(prev => {
      const newCpmk = [...(prev.cpmk || [])];
      newCpmk[index].nama_cpmk = value;
      return { ...prev, cpmk: newCpmk };
    });
  };

  const handleRemoveCpmkField = (index) => {
    if (!window.confirm("Hapus CPMK ini beserta semua indikatornya?")) return;
    setMatkulForm(prev => {
      const newCpmk = [...(prev.cpmk || [])];
      newCpmk.splice(index, 1);
      return { ...prev, cpmk: newCpmk };
    });
  };

  const handleAddIndikatorField = (cpmkIndex) => {
    setMatkulForm(prev => {
      const newCpmk = [...(prev.cpmk || [])];
      newCpmk[cpmkIndex].indikator.push("");
      return { ...prev, cpmk: newCpmk };
    });
  };

  const handleUpdateIndikatorField = (cpmkIndex, indIndex, value) => {
    setMatkulForm(prev => {
      const newCpmk = [...(prev.cpmk || [])];
      newCpmk[cpmkIndex].indikator[indIndex] = value;
      return { ...prev, cpmk: newCpmk };
    });
  };

  const handleRemoveIndikatorField = (cpmkIndex, indIndex) => {
    setMatkulForm(prev => {
      const newCpmk = [...(prev.cpmk || [])];
      newCpmk[cpmkIndex].indikator.splice(indIndex, 1);
      return { ...prev, cpmk: newCpmk };
    });
  };

  const handleAddCpmkSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMatkul) return;
    try {
      const res = await fetch('/api/paket-matkul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_cpmk',
          paketId: selectedMatkul.paketId,
          matkulId: selectedMatkul.matkulId,
          nama_cpmk: cpmkForm.nama_cpmk
        })
      });
      if (res.ok) {
        setShowAddCpmkModal(false);
        setCpmkForm({ nama_cpmk: "" });
        showToast("CPMK berhasil ditambahkan!");
        fetchData();
      }
    } catch (error) { console.error(error); }
  };

  const handleAddIndikatorSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCPMK) return;
    try {
      const res = await fetch('/api/paket-matkul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_indikator',
          paketId: selectedCPMK.paketId,
          matkulId: selectedCPMK.matkulId,
          cpmkId: selectedCPMK.cpmkId,
          indikator: indikatorForm.indikator
        })
      });
      if (res.ok) {
        setShowAddIndikatorModal(false);
        setIndikatorForm({ indikator: "" });
        showToast("Indikator berhasil ditambahkan!");
        fetchData();
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteMatkul = async (paketId, matkulId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus Mata Kuliah ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      const res = await fetch('/api/paket-matkul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_matkul', paketId, matkulId })
      });
      if (res.ok) { showToast("Mata Kuliah berhasil dihapus!"); fetchData(); }
    } catch (error) { console.error(error); }
  };

  const handleDeleteCpmk = async (paketId, matkulId, cpmkId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus CPMK ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      const res = await fetch('/api/paket-matkul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_cpmk', paketId, matkulId, cpmkId })
      });
      if (res.ok) { showToast("CPMK berhasil dihapus!"); fetchData(); }
    } catch (error) { console.error(error); }
  };

  const handleDeleteIndikator = async (paketId, matkulId, cpmkId, indikatorIndex) => {
    if (!window.confirm("Hapus indikator ini?")) return;
    try {
      const res = await fetch('/api/paket-matkul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_indikator', paketId, matkulId, cpmkId, indikatorIndex })
      });
      if (res.ok) { showToast("Indikator berhasil dihapus!"); fetchData(); }
    } catch (error) { console.error(error); }
  };

  // Ekstrak semua matkul untuk ditampilkan di UI
  const allMatkuls = pakets.flatMap(paket => 
    (paket.mata_kuliah || []).map(mk => ({ ...mk, paketId: paket._id, matkulId: mk._id }))
  );

  // Pagination Calculations
  const indexOfLastMitra = currentPageMitra * itemsPerPage;
  const indexOfFirstMitra = indexOfLastMitra - itemsPerPage;
  const currentMitras = mitras.slice(indexOfFirstMitra, indexOfLastMitra);
  const totalPagesMitra = Math.ceil(mitras.length / itemsPerPage);

  return (
    <DashboardLayout title="Master Data & OBE">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-8 bg-green-500 text-slate-800 dark:text-slate-100 px-6 py-3 rounded-xl shadow-lg shadow-green-500/30 z-50 animate-in slide-in-from-right-10 fade-in duration-300 font-bold">
          {toastMessage}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm p-1.5 rounded-xl w-max mb-8 border border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab("mitra")}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === "mitra" 
            ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" 
            : "text-slate-500 dark:text-slate-400 hover:text-white"
          }`}
        >
          Mitra Tempat Magang
        </button>
        <button 
          onClick={() => setActiveTab("kurikulum")}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === "kurikulum" 
            ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" 
            : "text-slate-500 dark:text-slate-400 hover:text-white"
          }`}
        >
          Kurikulum Konversi OBE
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-bold animate-pulse">Memuat data dari database...</div>
      ) : (
        <>
          {/* Tab 1: Mitra Tempat Magang */}
          {activeTab === "mitra" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Daftar Instansi / Mitra Magang</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola perusahaan tempat mahasiswa melakukan kegiatan magang.</p>
                </div>
                <button 
                  onClick={() => setShowMitraModal(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-200/50"
                >
                  + Tambah Mitra Baru
                </button>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold">
                      <th className="py-4 px-6 w-16 text-center">No</th>
                      <th className="py-4 px-6">Nama Instansi</th>
                      <th className="py-4 px-6">Jumlah Tersedia</th>
                      <th className="py-4 px-6">Divisi / Posisi</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {currentMitras.length === 0 ? (
                      <tr><td colSpan="5" className="py-8 text-center text-slate-500 dark:text-slate-400">Belum ada data mitra.</td></tr>
                    ) : (
                      currentMitras.map((mitra, index) => (
                        <tr key={mitra._id} className="hover:bg-slate-50 dark:bg-slate-800/80 transition-colors">
                          <td className="py-4 px-6 text-center text-slate-500 dark:text-slate-400 font-medium">{indexOfFirstMitra + index + 1}</td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-800 dark:text-slate-100">{mitra.nama_instansi}</div>
                            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold capitalize ${mitra.jenis_skema === 'corporate' ? 'bg-blue-50 text-blue-600' : mitra.jenis_skema === 'wirausaha' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                              {mitra.kategori || mitra.jenis_skema}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {(mitra.posisi_list || []).reduce((acc, pos) => acc + (pos.kuota || 0), 0)} Slot
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5">
                              {(mitra.posisi_list || []).length === 0 ? (
                                <span className="text-xs text-slate-400 italic">Belum ada posisi</span>
                              ) : (
                                (mitra.posisi_list || []).map(pos => (
                                  <span key={pos._id} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] rounded-md font-semibold border border-slate-200 dark:border-slate-600">
                                    {pos.nama_posisi}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setMitraForm({ id: mitra._id, nama_instansi: mitra.nama_instansi, jenis_skema: mitra.jenis_skema === 'wirausaha' ? 'Wirausaha' : mitra.jenis_skema === 'Pemerintahan' ? 'Pemerintahan' : 'Corporate', alamat: mitra.alamat, deskripsi_mitra: mitra.deskripsi_mitra || "" }); setShowMitraModal(true); }} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Edit</button>
                              <button onClick={() => handleDeleteMitra(mitra._id)} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Hapus</button>
                              <button onClick={() => handleOpenKelolaPosisi(mitra)} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">Kelola Posisi</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPagesMitra > 1 && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Menampilkan {indexOfFirstMitra + 1} - {Math.min(indexOfLastMitra, mitras.length)} dari total {mitras.length} mitra
                  </span>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPageMitra === 1}
                      onClick={() => setCurrentPageMitra(prev => prev - 1)}
                      className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPagesMitra }).map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentPageMitra(i + 1)}
                        className={`w-9 h-9 flex items-center justify-center font-bold rounded-lg shadow-sm transition-colors border ${currentPageMitra === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      disabled={currentPageMitra === totalPagesMitra}
                      onClick={() => setCurrentPageMitra(prev => prev + 1)}
                      className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Kurikulum Konversi OBE */}
          {activeTab === "kurikulum" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Master Data Capaian Pembelajaran</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola indikator penilaian logbook mahasiswa untuk konversi SKS Mata Kuliah.</p>
                </div>
                <button 
                  onClick={() => setShowAddMatkulModal(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-200/50"
                >
                  + Tambah Matakuliah
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allMatkuls.map((mk) => (
                  <div key={mk.matkulId} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{mk.nama}</h3>
                          <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{mk.kode}</span>
                        </div>
                        <p className="text-sm font-semibold text-indigo-600 mt-1">{mk.sks} SKS</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDeleteMatkul(mk.paketId, mk.matkulId)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 hover:text-red-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                          title="Hapus Matakuliah"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Hapus
                        </button>
                        <button 
                          onClick={() => { 
                            setSelectedMatkul({ paketId: mk.paketId, matkulId: mk.matkulId, nama: mk.nama }); 
                            setMatkulForm({ 
                              kode: mk.kode || "", 
                              nama: mk.nama, 
                              sks: mk.sks,
                              cpmk: mk.cpmk ? JSON.parse(JSON.stringify(mk.cpmk)) : []
                            }); 
                            setShowEditMatkulModal(true); 
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                          title="Edit Matakuliah"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Edit
                        </button>
                        <button 
                          onClick={() => { setSelectedMatkul({ paketId: mk.paketId, matkulId: mk.matkulId, nama: mk.nama }); setShowAddCpmkModal(true); }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          + CPMK
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Daftar CPMK & Indikator Harian:</p>
                      {!mk.cpmk || mk.cpmk.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Belum ada CPMK</p>
                      ) : (
                        mk.cpmk.map((c, i) => (
                          <div key={c._id || i} className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-300 dark:border-slate-600 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">C{i+1}</div>
                              <div className="flex-1">
                                <p className="text-sm text-slate-800 dark:text-slate-100 font-bold leading-snug">{c.nama_cpmk}</p>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleDeleteCpmk(mk.paketId, mk.matkulId, c._id)}
                                  className="px-2 py-1 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 text-[10px] font-bold rounded-md transition-colors flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  Hapus
                                </button>
                                <button 
                                  onClick={() => { setSelectedCPMK({ paketId: mk.paketId, matkulId: mk.matkulId, cpmkId: c._id, nama_cpmk: c.nama_cpmk }); setShowAddIndikatorModal(true); }}
                                  className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900 border border-slate-200 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-md transition-colors"
                                >
                                  + Indikator
                                </button>
                              </div>
                            </div>
                            
                            {/* Indikator List */}
                            <div className="pl-9 space-y-2">
                              {!c.indikator || c.indikator.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic border-l-2 border-slate-200 dark:border-slate-700 pl-3">Belum ada indikator kegiatan harian.</p>
                              ) : (
                                c.indikator.map((ind, j) => (
                                  <div key={j} className="flex justify-between items-start border-l-2 border-indigo-200 dark:border-indigo-800 pl-3 group">
                                    <div className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 mt-1.5 shrink-0" />
                                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{ind}</p>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteIndikator(mk.paketId, mk.matkulId, c._id, j)}
                                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 -mt-1 -mr-1"
                                      title="Hapus Indikator"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALS */}

      {/* Modal Tambah Mitra */}
      {showMitraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tambah Mitra Magang Baru</h3>
              <button onClick={() => setShowMitraModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleMitraSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Nama Instansi</label>
                  <input required value={mitraForm.nama_instansi} onChange={(e) => setMitraForm({...mitraForm, nama_instansi: e.target.value})} type="text" placeholder="PT Contoh Sukses" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800/80" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Jenis Skema</label>
                  <select value={mitraForm.jenis_skema} onChange={(e) => setMitraForm({...mitraForm, jenis_skema: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800/80 appearance-none">
                    <option value="Corporate">Corporate / Perusahaan</option>
                    <option value="Wirausaha">Wirausaha / BUMDes</option>
                    <option value="Pemerintahan">Pemerintahan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Alamat Lengkap</label>
                  <textarea required value={mitraForm.alamat} onChange={(e) => setMitraForm({...mitraForm, alamat: e.target.value})} rows="2" placeholder="Jl. Raya Makmur No 123..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800/80"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Deskripsi Mitra</label>
                  <textarea value={mitraForm.deskripsi_mitra} onChange={(e) => setMitraForm({...mitraForm, deskripsi_mitra: e.target.value})} rows="3" placeholder="Tentang perusahaan..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800/80"></textarea>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-300 dark:border-slate-600 flex justify-end gap-3">
                <button type="button" onClick={() => setShowMitraModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Matakuliah */}
      {showAddMatkulModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tambah Mata Kuliah</h3>
              <button onClick={() => { setShowAddMatkulModal(false); setMatkulForm({ kode: "", nama: "", sks: 3 }); }} className="text-slate-500 dark:text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleMatkulSubmit}>
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Kode</label>
                    <input required value={matkulForm.kode} onChange={(e) => setMatkulForm({...matkulForm, kode: e.target.value})} type="text" placeholder="MK.001" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800/80" />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">SKS</label>
                    <input required value={matkulForm.sks} onChange={(e) => setMatkulForm({...matkulForm, sks: e.target.value})} type="number" min="1" max="6" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800/80" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Nama Mata Kuliah</label>
                  <input required value={matkulForm.nama} onChange={(e) => setMatkulForm({...matkulForm, nama: e.target.value})} type="text" placeholder="Contoh: Manajemen Bisnis" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800/80" />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-300 dark:border-slate-600 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowAddMatkulModal(false); setMatkulForm({ kode: "", nama: "", sks: 3 }); }} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors">Simpan Matkul</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Matakuliah (Besar dengan CPMK) */}
      {showEditMatkulModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Edit Mata Kuliah</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ubah detail dan kelola CPMK & Indikator sekaligus.</p>
              </div>
              <button onClick={() => { setShowEditMatkulModal(false); setMatkulForm({ kode: "", nama: "", sks: 3 }); }} className="text-slate-500 dark:text-slate-400 hover:text-red-500 font-bold text-2xl">&times;</button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              <form id="form-edit-matkul" onSubmit={handleEditMatkulSubmit} className="space-y-8">
                
                {/* Informasi Dasar */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Informasi Dasar</h4>
                  <div className="flex gap-4">
                    <div className="w-1/4">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kode</label>
                      <input required value={matkulForm.kode} onChange={(e) => setMatkulForm({...matkulForm, kode: e.target.value})} type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800" />
                    </div>
                    <div className="w-1/4">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">SKS</label>
                      <input required value={matkulForm.sks} onChange={(e) => setMatkulForm({...matkulForm, sks: e.target.value})} type="number" min="1" max="6" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800" />
                    </div>
                    <div className="w-2/4">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Mata Kuliah</label>
                      <input required value={matkulForm.nama} onChange={(e) => setMatkulForm({...matkulForm, nama: e.target.value})} type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800" />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-700" />

                {/* Pengelolaan CPMK & Indikator */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Pengelolaan CPMK & Indikator</h4>
                  </div>

                  <div className="space-y-6">
                    {(!matkulForm.cpmk || matkulForm.cpmk.length === 0) && (
                      <div className="p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada CPMK untuk mata kuliah ini.</p>
                      </div>
                    )}

                    {(matkulForm.cpmk || []).map((cpmk, cpmkIndex) => (
                      <div key={cpmkIndex} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-300 dark:border-slate-600 p-5 space-y-4 relative group">
                        
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 mt-1 shadow-sm">
                            C{cpmkIndex + 1}
                          </div>
                          <div className="flex-1">
                            <textarea 
                              required
                              value={cpmk.nama_cpmk} 
                              onChange={(e) => handleUpdateCpmkField(cpmkIndex, e.target.value)}
                              placeholder="Nama/Deskripsi CPMK..."
                              rows="2"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-100 shadow-sm transition-colors"
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveCpmkField(cpmkIndex)}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 hover:border-red-300 flex items-center justify-center transition-colors shadow-sm mt-1"
                            title="Hapus CPMK"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>

                        {/* Indikator List per CPMK */}
                        <div className="pl-11 space-y-3">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Indikator Penilaian:</p>
                          
                          {(!cpmk.indikator || cpmk.indikator.length === 0) && (
                            <p className="text-sm text-slate-400 italic">Belum ada indikator.</p>
                          )}

                          {cpmk.indikator.map((ind, indIndex) => (
                            <div key={indIndex} className="flex gap-2 items-start group/ind">
                              <div className="w-6 flex items-center justify-center shrink-0 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                              </div>
                              <input 
                                required
                                value={ind}
                                onChange={(e) => handleUpdateIndikatorField(cpmkIndex, indIndex, e.target.value)}
                                type="text"
                                placeholder="Detail indikator..."
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-sm shadow-sm transition-colors"
                              />
                              <button 
                                type="button"
                                onClick={() => handleRemoveIndikatorField(cpmkIndex, indIndex)}
                                className="w-9 h-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"
                                title="Hapus Indikator"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                          
                          <button 
                            type="button"
                            onClick={() => handleAddIndikatorField(cpmkIndex)}
                            className="mt-2 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                          >
                            + Tambah Indikator
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-center pt-2">
                      <button 
                        type="button"
                        onClick={handleAddCpmkField}
                        className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Tambah CPMK Baru
                      </button>
                    </div>

                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-300 dark:border-slate-700 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => { setShowEditMatkulModal(false); setMatkulForm({ kode: "", nama: "", sks: 3 }); }} className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors shadow-sm">Batal</button>
              <button form="form-edit-matkul" type="submit" className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah CPMK */}
      {showAddCpmkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tambah CPMK</h3>
              <button onClick={() => setShowAddCpmkModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleAddCpmkSubmit}>
              <div className="p-6 space-y-4">
                <div className="bg-indigo-50 text-indigo-700 p-4 rounded-xl text-sm mb-2 border border-indigo-100">
                  Menambah CPMK untuk matkul: <br/><strong className="text-base">{selectedMatkul?.nama}</strong>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Nama CPMK</label>
                  <textarea required value={cpmkForm.nama_cpmk} onChange={(e) => setCpmkForm({nama_cpmk: e.target.value})} rows="3" placeholder="Contoh: CPMK 1: Mampu mengidentifikasi..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800/80"></textarea>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-300 dark:border-slate-600 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddCpmkModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors">Simpan CPMK</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Indikator CPMK */}
      {showAddIndikatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tambah Indikator OBE</h3>
              <button onClick={() => setShowAddIndikatorModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleAddIndikatorSubmit}>
              <div className="p-6 space-y-4">
                <div className="bg-indigo-50 text-indigo-700 p-4 rounded-xl text-sm mb-2 border border-indigo-100">
                  Menambah indikator untuk: <br/><strong className="text-base">{selectedCPMK?.nama_cpmk}</strong>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Deskripsi Indikator</label>
                  <textarea required value={indikatorForm.indikator} onChange={(e) => setIndikatorForm({indikator: e.target.value})} rows="4" placeholder="Mahasiswa mampu..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800/80"></textarea>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Indikator ini akan digunakan DPL dan Mentor saat memvalidasi logbook harian.</p>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-300 dark:border-slate-600 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddIndikatorModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors">Simpan Indikator</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Posisi (Besar) */}
      {showKelolaPosisiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-5 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Lowongan / Posisi Magang</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedMitraForPosisi?.nama_instansi}</p>
              </div>
              <button onClick={() => setShowKelolaPosisiModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between mb-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Daftar Divisi/Posisi Tersedia</h4>
                <button 
                  onClick={() => { setPosisiForm({ id: null, nama_posisi: "", konsentrasi: "SDM", kuota: 1, deskripsi_pekerjaan: "", kriteria_kandidat: "", sistem_kerja: "WFO" }); setShowPosisiFormModal(true); }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors"
                >
                  + Tambah Posisi
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posisiList.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl">Belum ada posisi dibuka.</div>
                ) : (
                  posisiList.map(pos => (
                    <div key={pos._id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm relative group hover:shadow-md transition-all">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setPosisiForm({ id: pos._id, nama_posisi: pos.nama_posisi, konsentrasi: pos.konsentrasi, kuota: pos.kuota, deskripsi_pekerjaan: pos.deskripsi_pekerjaan || "", kriteria_kandidat: pos.kriteria_kandidat || "", sistem_kerja: pos.sistem_kerja || "WFO" }); setShowPosisiFormModal(true); }} className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-indigo-600 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                        <button onClick={() => handleDeletePosisi(pos._id)} className="p-1.5 bg-slate-100 hover:bg-red-100 text-red-600 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                      </div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-100 pr-12">{pos.nama_posisi}</h5>
                      <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-bold rounded-md ${pos.sistem_kerja === 'WFH' ? 'bg-green-50 text-green-600' : pos.sistem_kerja === 'Hybrid' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{pos.sistem_kerja || 'WFO'}</span>
                      <div className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex justify-between"><span>Konsentrasi:</span> <strong className="text-slate-700 dark:text-slate-300 text-right">{pos.konsentrasi}</strong></div>
                        <div className="flex justify-between"><span>Kuota Tersedia:</span> <strong className="text-slate-700 dark:text-slate-300">{pos.kuota} Mahasiswa</strong></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Posisi (Nested) */}
      {showPosisiFormModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{posisiForm.id ? 'Edit' : 'Tambah'} Posisi Magang</h3>
              <button onClick={() => setShowPosisiFormModal(false)} className="text-slate-500 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              <form id="posisiForm" onSubmit={handlePosisiSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Nama Divisi / Posisi</label>
                    <input required value={posisiForm.nama_posisi} onChange={e => setPosisiForm({...posisiForm, nama_posisi: e.target.value})} type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700" placeholder="Contoh: Digital Marketing" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Konsentrasi Manajemen</label>
                    <select value={posisiForm.konsentrasi} onChange={e => setPosisiForm({...posisiForm, konsentrasi: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700">
                      <option value="SDM">Manajemen SDM</option>
                      <option value="Keuangan">Manajemen Keuangan</option>
                      <option value="Pemasaran">Manajemen Pemasaran</option>
                      <option value="Pengembangan Bisnis">Pengembangan Bisnis</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Kuota Penerimaan</label>
                    <input required value={posisiForm.kuota} onChange={e => setPosisiForm({...posisiForm, kuota: Number(e.target.value)})} type="number" min="1" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Sistem Kerja</label>
                    <select value={posisiForm.sistem_kerja} onChange={e => setPosisiForm({...posisiForm, sistem_kerja: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700">
                      <option value="WFO">WFO (Work From Office)</option>
                      <option value="WFH">WFH (Work From Home)</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Deskripsi Pekerjaan</label>
                  <textarea value={posisiForm.deskripsi_pekerjaan} onChange={e => setPosisiForm({...posisiForm, deskripsi_pekerjaan: e.target.value})} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700" placeholder="Uraikan tugas harian divisi ini..."></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Kriteria Kandidat</label>
                  <textarea value={posisiForm.kriteria_kandidat} onChange={e => setPosisiForm({...posisiForm, kriteria_kandidat: e.target.value})} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700" placeholder="Syarat: Menguasai Excel, Analitis..."></textarea>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowPosisiFormModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
              <button type="submit" form="posisiForm" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors">Simpan Posisi</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
