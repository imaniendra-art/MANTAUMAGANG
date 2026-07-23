"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';

export default function CetakSertifikatMahasiswa() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [host, setHost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setHost(window.location.origin);
    if (session?.user?.id) {
      fetch(`/api/laporan-akhir?mhsId=${session.user.id}`)
        .then(res => res.json())
        .then(d => {
          if (d.laporan && d.pengajuan) {
            setData(d);
          }
        });
    }
  }, [session]);

  if (!data) return <div className="p-10 text-center">Memuat Sertifikat...</div>;

  const { laporan, pengajuan, config } = data;
  const mhs = session.user;
  const mitra = pengajuan.mitra_id?.nama_perusahaan || pengajuan.detail_tempat?.nama;

  const ketuaInstitusi = config?.nama_ketua_institusi || 'Dr. Ibrahim Syah, S.E.,M.M';

  const verifyUrlSertifikat = host ? `${host}/validasi/sertifikat/${laporan._id}` : '';
  const qrCodeUrl = verifyUrlSertifikat ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrlSertifikat)}` : '';

  // Evaluasi calculations
  const transkrip = pengajuan.transkrip_final || [];
  const validTranskrip = transkrip.filter(mk => typeof mk.nilai_angka === 'number').map(mk => ({
    nama: mk.nama_mk,
    sks: mk.sks,
    nilai: mk.nilai_angka
  }));

  const mentorPenilaian = pengajuan.penilaian_mentor || {};
  const dplPenilaian = pengajuan.penilaian_dpl || {};
  const approvedSkills = dplPenilaian.approved_skills || [];
  
  const additionalIndicators = [
    { nama: "Sikap & Kedisiplinan", nilai: mentorPenilaian.kedisiplinan },
    { nama: "Tanggung Jawab & Kinerja", nilai: mentorPenilaian.tanggung_jawab },
    { nama: "Komunikasi & Kerja Sama Tim", nilai: mentorPenilaian.komunikasi_tim },
    { nama: "Sistematika Penulisan Laporan", nilai: dplPenilaian.sistematika_laporan },
    { nama: "Kualitas Isi Laporan", nilai: dplPenilaian.kualitas_isi },
    { nama: "Penguasaan Materi (Presentasi)", nilai: dplPenilaian.penguasaan_materi }
  ].filter(i => i.nilai !== undefined && i.nilai !== null).map(i => ({
    ...i,
    sks: '-'
  }));

  const allScores = [...validTranskrip, ...additionalIndicators];
  const totalNilai = allScores.reduce((sum, item) => sum + item.nilai, 0);
  const average = allScores.length > 0 ? totalNilai / allScores.length : 0;
  
  let predikat = "BAIK";
  if (average >= 85) predikat = "SANGAT BAIK";
  else if (average >= 70) predikat = "BAIK";
  else if (average >= 50) predikat = "CUKUP";
  else predikat = "KURANG";

  function getHuruf(finalScore) {
    if (finalScore >= 85) return 'A';
    if (finalScore >= 80) return 'A-';
    if (finalScore >= 75) return 'B+';
    if (finalScore >= 70) return 'B';
    if (finalScore >= 65) return 'B-';
    if (finalScore >= 60) return 'C+';
    if (finalScore >= 50) return 'C';
    return 'E';
  }

  const verifyUrlDpl = host ? `${host}/validasi/penilaian-dpl/${laporan._id}` : '';
  const dplQrCodeUrl = verifyUrlDpl ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrlDpl)}` : '';
  
  const verifyUrlMentor = host ? `${host}/validasi/penilaian-mentor/${laporan._id}` : '';
  const mentorQrCodeUrl = verifyUrlMentor ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrlMentor)}` : '';
  
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const page1 = document.getElementById('page-1');
      const page2 = document.getElementById('page-2');

      const scale = 2;
      const getOpts = (el) => ({
        quality: 1,
        bgcolor: '#ffffff',
        width: el.clientWidth * scale,
        height: el.clientHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${el.clientWidth}px`,
          height: `${el.clientHeight}px`,
        }
      });

      const dataUrl1 = await domtoimage.toJpeg(page1, getOpts(page1));
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      pdf.addImage(dataUrl1, 'JPEG', 0, 0, 297, 210);

      if (page2) {
        const dataUrl2 = await domtoimage.toJpeg(page2, getOpts(page2));
        pdf.addPage();
        pdf.addImage(dataUrl2, 'JPEG', 0, 0, 297, 210);
      }

      pdf.save(`Sertifikat_Magang_${mhs.nama_lengkap.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Gagal membuat PDF:", error);
      alert("Gagal mengunduh PDF. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-200 min-h-screen font-sans text-slate-800 flex flex-col items-center justify-center p-8 gap-8 print:p-0 print:gap-0 print:block print:bg-white">
      <div className="fixed top-5 right-5 print:hidden z-50">
        <button onClick={handleDownloadPDF} disabled={isGenerating} className={`px-6 py-3 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all ${isGenerating ? 'bg-slate-500 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
          {isGenerating ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          {isGenerating ? 'Memproses PDF...' : 'Simpan sebagai PDF'}
        </button>
        <p className="text-xs text-center mt-2 text-slate-500 font-medium">Download file PDF resolusi tinggi</p>
      </div>

      <div id="sertifikat-content" className="flex flex-col gap-8 items-center">
        {/* Kontainer Kertas A4 Landscape: 297mm x 210mm */}
        <div id="page-1" className="w-[297mm] h-[210mm] bg-white relative overflow-hidden shadow-2xl print:shadow-none flex flex-col justify-center text-center p-[20mm]">
        
        {/* Latar Belakang Elegan */}
        <img src="/bg_serti.png" alt="Background" className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col h-full justify-between items-center">
          
          <div className="w-full flex justify-between items-start">
            <div className="flex items-center gap-4">
              <img src="/logo_stimi.png" alt="Logo STIMI" className="h-16 object-contain" />
              <img src="/logo_berdampak.png" alt="Logo Berdampak" className="h-16 object-contain" />
              <img src="/mm.png" alt="Logo Mantau Magang" className="h-12 object-contain" />
            </div>
            <div className="text-right flex flex-col justify-center">
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-widest leading-none" style={{ fontFamily: 'Georgia, serif' }}>Sertifikat</h2>
              <p className="text-base font-black text-emerald-700 uppercase tracking-widest leading-none mt-1">Penyelesaian Magang Berdampak</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Sekolah Tinggi Ilmu Manajemen Indonesia YAPMI</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center w-full my-8">
            <p className="text-lg text-slate-600 mb-6">Diberikan kepada:</p>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-wider mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              {mhs.nama_lengkap}
            </h1>
            <p className="text-xl text-slate-600 font-bold mb-8">NIM: {mhs.nim_nidn}</p>

            <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
              Telah berpartisipasi dan menyelesaikan program Magang Berdampak STIMI YAPMI dengan predikat <span className="font-bold text-emerald-600">{predikat}</span> di <span className="font-bold text-slate-800">{mitra}</span>. Sertifikat ini dianugerahkan sebagai bentuk apresiasi atas dedikasi, kontribusi aktif, serta pencapaian kompetensi profesional yang diraih selama masa magang.
            </p>
          </div>

          <div className="w-full flex justify-between items-end">
            <div className="flex gap-4 items-end">
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code SKPI" className="w-24 h-24 border border-slate-200 p-1 bg-white" />}
              <div className="text-left text-xs text-slate-500 mb-1">
                <p className="font-bold text-slate-800 text-sm mb-1">{laporan.nomor_sertifikat ? `No. ${laporan.nomor_sertifikat}` : ''}</p>
                <p className="font-bold">Verifikasi Digital (SKPI)</p>
                <p>Scan kode QR untuk memvalidasi</p>
                <p>keaslian dokumen ini di sistem</p>
                <p>MANTAU MAGANG STIMI YAPMI Makassar.</p>
              </div>
            </div>

            <div className="text-center w-80">
              <p className="text-sm text-slate-600 mb-16">
                Makassar, {new Date(pengajuan.tanggal_selesai).toLocaleDateString('id-ID')}<br/>
                Ketua Sekolah Tinggi Ilmu Manajemen<br/>
                Indonesia YAPMI Makassar,
              </p>
              <p className="font-bold text-slate-800 mt-2">{ketuaInstitusi}</p>
            </div>
          </div>

        </div>
      </div>

      {/* HALAMAN 2: TRANSKRIP / NILAI */}
      <div id="page-2" className="page-break w-[297mm] h-[210mm] bg-white relative overflow-hidden shadow-2xl print:shadow-none flex flex-col px-[20mm] pb-[20mm] pt-[10mm] mt-8 print:mt-0">
        <img src="/bg_serti.png" alt="Background" className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />
        <div className="relative z-10 flex flex-col h-full items-center">
          
          <h2 className="text-[26px] font-black text-slate-900 uppercase tracking-widest mb-4 mt-1" style={{ fontFamily: 'Georgia, serif' }}>Daftar Penilaian Magang Berdampak</h2>

          <div className="w-full max-w-5xl flex justify-between text-sm font-bold text-slate-700 mb-4 px-4 bg-white/50 py-2 rounded-lg border border-slate-200 shadow-sm">
            <p>NAMA: {mhs.nama_lengkap}</p>
            <p>NIM: {mhs.nim_nidn}</p>
            <p>LOKASI: {mitra}</p>
          </div>

          <div className="w-full max-w-5xl bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col gap-4">
            
            <div className="flex flex-row gap-6 w-full h-full">
              {/* Tabel Mata Kuliah */}
              <div className="w-1/2 flex flex-col">
                <h3 className="font-bold text-slate-800 mb-2 text-sm">A. Nilai Mata Kuliah</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-slate-800">
                      <th className="py-1.5 px-2 font-bold text-[11px] w-8">No</th>
                      <th className="py-1.5 px-2 font-bold text-[11px]">Mata Kuliah</th>
                      <th className="py-1.5 px-2 font-bold text-center text-[11px] w-10">SKS</th>
                      <th className="py-1.5 px-2 font-bold text-center text-[11px] w-16">Nilai Angka</th>
                      <th className="py-1.5 px-2 font-bold text-center text-[11px] w-16">Nilai Huruf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validTranskrip.length > 0 ? validTranskrip.map((mk, index) => (
                      <tr key={index} className="border-b border-slate-300/60 text-slate-700">
                        <td className="py-1.5 px-2 text-[11px]">{index + 1}</td>
                        <td className="py-1.5 px-2 font-medium text-[11px] leading-tight">{mk.nama}</td>
                        <td className="py-1.5 px-2 text-center text-[11px]">{mk.sks}</td>
                        <td className="py-1.5 px-2 text-center text-[11px]">{Math.round(mk.nilai)}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-[11px]">{getHuruf(mk.nilai)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-[11px] text-slate-500 italic">Belum ada data nilai mata kuliah.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tabel Indikator Kinerja */}
              <div className="w-1/2 flex flex-col">
                <h3 className="font-bold text-slate-800 mb-2 text-sm">B. Indikator Kinerja</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-slate-800">
                      <th className="py-1.5 px-2 font-bold text-[11px] w-8">No</th>
                      <th className="py-1.5 px-2 font-bold text-[11px]">Komponen Penilaian</th>
                      <th className="py-1.5 px-2 font-bold text-center text-[11px] w-16">Nilai Angka</th>
                      <th className="py-1.5 px-2 font-bold text-center text-[11px] w-16">Nilai Huruf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalIndicators.length > 0 ? additionalIndicators.map((item, index) => (
                      <tr key={index} className="border-b border-slate-300/60 text-slate-700">
                        <td className="py-1.5 px-2 text-[11px]">{index + 1}</td>
                        <td className="py-1.5 px-2 font-medium text-[11px] leading-tight">{item.nama}</td>
                        <td className="py-1.5 px-2 text-center text-[11px]">{Math.round(item.nilai)}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-[11px]">{getHuruf(item.nilai)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-[11px] text-slate-500 italic">Belum ada data nilai indikator.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="w-full flex gap-6 mt-1">
              {/* Hard Skill / Soft Skill */}
              <div className="w-2/3 flex flex-col">
                <h3 className="font-bold text-slate-800 mb-1.5 text-sm">C. Keterampilan yang Diperoleh (Skill)</h3>
                <div className="flex flex-wrap gap-1.5 p-2 border border-slate-300 rounded-lg bg-slate-50/50 min-h-[50px] content-start">
                  {approvedSkills.length > 0 ? approvedSkills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200">
                      {skill}
                    </span>
                  )) : (
                    <span className="text-[10px] text-slate-500 italic mt-0.5">Belum ada keterampilan yang dinilai.</span>
                  )}
                </div>
              </div>
              
              {/* Rata-Rata Keseluruhan (Besar tapi tidak memanjang) */}
              <div className="w-1/3 flex flex-col justify-end">
                <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Rata-Rata Akhir</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 leading-none">{Math.round(average)}</span>
                    <span className="text-lg font-bold text-emerald-600">{predikat}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Skala Nilai */}
            <div className="mt-auto pt-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500 pt-1 border-t-2 border-slate-800">
                <span className="font-bold text-slate-700">Skala Nilai:</span>
                <span>A: 85-100 (Sangat Baik)</span>
                <span>A-: 80-84</span>
                <span>B+: 75-79</span>
                <span>B: 70-74 (Baik)</span>
                <span>B-: 65-69</span>
                <span>C+: 60-64</span>
                <span>C: 50-59 (Cukup)</span>
                <span>E: &lt;50 (Kurang)</span>
              </div>
            </div>

          </div>

          <div className="w-full flex justify-between items-end mt-auto px-10">
            {/* Tanda Tangan DPL */}
            <div className="text-center w-56 flex flex-col items-center">
              <p className="text-xs text-slate-600 mb-2">Dosen Pembimbing Lapangan</p>
              {dplQrCodeUrl && <img src={dplQrCodeUrl} alt="QR DPL" className="w-16 h-16 mb-2 mix-blend-multiply" />}
              <p className="font-bold text-slate-800 text-xs truncate w-full mt-1">{pengajuan.dpl_id?.nama_lengkap || 'Dosen Pembimbing'}</p>
            </div>

            {/* Tanda Tangan Mentor */}
            <div className="text-center w-56 flex flex-col items-center">
              <p className="text-xs text-slate-600 mb-2">Mentor Industri</p>
              {mentorQrCodeUrl && <img src={mentorQrCodeUrl} alt="QR Mentor" className="w-16 h-16 mb-2 mix-blend-multiply" />}
              <p className="font-bold text-slate-800 text-xs truncate w-full mt-1">{pengajuan.mentor_id?.nama_lengkap || 'Mentor Industri'}</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
