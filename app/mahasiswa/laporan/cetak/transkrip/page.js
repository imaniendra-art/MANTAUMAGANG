"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import QRCode from 'react-qr-code';

export default function CetakTranskrip() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/laporan-akhir?mhsId=${session.user.id}`)
        .then(res => res.json())
        .then(d => {
          if (d.laporan && d.pengajuan) {
            setData(d);
            fetch("/api/config").then(r=>r.json()).then(c=>{if(c)setConfig(c)});
          }
        });
    }
  }, [session]);

  if (!data) return <div className="p-10 text-center">Memuat Dokumen SKPI...</div>;

  const { laporan, pengajuan } = data;
  const mhs = session.user;
  const mitra = pengajuan.mitra_id?.nama_perusahaan || pengajuan.detail_tempat?.nama;
  
  // URL validasi untuk QR Code
  const verifyUrl = `http://localhost:3020/verify/${laporan._id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

  const transkrip = pengajuan.transkrip_final || [];
  const isDinilai = transkrip.length > 0;
  
  const totalSKS = transkrip.reduce((sum, mk) => sum + (mk.sks || 0), 0);
  
  let avgAngka = 0;
  let predikat = "BELUM DINILAI";
  if (isDinilai) {
    avgAngka = transkrip.reduce((sum, mk) => sum + mk.nilai_angka, 0) / transkrip.length;
    predikat = avgAngka >= 85 ? "SANGAT BAIK (EXCELLENT)" : avgAngka >= 70 ? "BAIK (GOOD)" : avgAngka >= 60 ? "CUKUP (SATISFACTORY)" : "KURANG (POOR)";
  }

  return (
    <div className="bg-slate-200 min-h-screen font-serif text-black p-8 print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* Tombol Print (Sembunyi saat diprint) */}
      <div className="fixed top-5 right-5 print:hidden z-50 flex flex-col items-end">
        <button onClick={() => window.print()} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak / Simpan PDF
        </button>
        <p className="text-xs text-center mt-2 text-slate-500 font-medium bg-white/80 p-2 rounded shadow backdrop-blur-sm">
          Pilih <strong>Save as PDF</strong> di pengaturan browser.
        </p>
      </div>

      {/* HALAMAN 1: IDENTITAS & PENYELENGGARA */}
      <div className="max-w-[21cm] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none p-[1.5cm] min-h-[29.7cm] relative box-border flex flex-col">
        
        {/* KOP SURAT */}
        <div className="flex items-center justify-between border-b-[3px] border-black pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src="/logo_stimi.png" alt="Logo STIMI" className="h-16 object-contain" />
            <img src="/mm.png" alt="Logo Mantau Magang" className="h-14 object-contain" />
          </div>
          <div className="text-right">
            <h1 className="text-lg font-bold uppercase text-slate-900 tracking-wider">STIMI YAPMI Makassar</h1>
            <p className="text-xs text-slate-600 font-sans">Jl. Perintis Kemerdekaan, Kota Makassar</p>
            <p className="text-xs font-bold text-slate-700 font-sans mt-1">MANTAU MAGANG</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Surat Keterangan Pendamping Ijazah (SKPI)</h2>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 italic mt-1">Diploma Supplement</h3>
        </div>

        <div className="text-sm text-justify mb-6">
          <p>
            Surat Keterangan Pendamping Ijazah (SKPI) ini dikeluarkan untuk memberikan penjelasan obyektif mengenai prestasi dan kompetensi lulusan. Dokumen ini mendampingi Ijazah dan Transkrip Akademik resmi.
          </p>
          <p className="italic text-slate-500 mt-1">
            This Diploma Supplement is issued to provide an objective description of the achievements and competencies of the graduate. This document supplements the official Certificate and Academic Transcript.
          </p>
        </div>

        {/* I. IDENTITAS DIRI */}
        <div className="mb-8">
          <h3 className="font-bold bg-slate-100 p-2 border-l-4 border-emerald-600 mb-4">
            I. INFORMASI TENTANG IDENTITAS DIRI PEMEGANG SKPI<br/>
            <span className="text-xs italic text-slate-500 font-normal">Information Identifying the Holder of Diploma Supplement</span>
          </h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="w-56 py-1">Nomor SKPI<br/><span className="italic text-slate-500 text-xs">SKPI Number</span></td>
                <td className="w-4 align-top py-1">:</td>
                <td className="align-top py-1">-</td>
              </tr>
              <tr>
                <td className="py-1">Nomor Ijazah Nasional<br/><span className="italic text-slate-500 text-xs">National Certificate Number</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">-</td>
              </tr>
              <tr>
                <td className="py-1">Nama Lengkap<br/><span className="italic text-slate-500 text-xs">Full Name</span></td>
                <td className="align-top py-1">:</td>
                <td className="uppercase font-bold align-top py-1">{mhs.nama_lengkap}</td>
              </tr>
              <tr>
                <td className="py-1">Tempat dan Tanggal Lahir<br/><span className="italic text-slate-500 text-xs">Place and Date of Birth</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">-</td>
              </tr>
              <tr>
                <td className="py-1">Nomor Induk Mahasiswa<br/><span className="italic text-slate-500 text-xs">Student Identification Number</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">{mhs.nim_nidn}</td>
              </tr>
              <tr>
                <td className="py-1">Tgl Masuk dan Kelulusan<br/><span className="italic text-slate-500 text-xs">Date of Entry and Completion</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">-</td>
              </tr>
              <tr>
                <td className="py-1">Gelar Akademik<br/><span className="italic text-slate-500 text-xs">Name of Qualification</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">Sarjana Manajemen (S.M)<br/><span className="italic text-slate-500 text-xs">Bachelor of Management</span></td>
              </tr>
              {mhs.konsentrasi && (
                <tr>
                  <td className="py-1">Konsentrasi<br/><span className="italic text-slate-500 text-xs">Concentration</span></td>
                  <td className="align-top py-1">:</td>
                  <td className="uppercase align-top py-1">{mhs.konsentrasi}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* II. IDENTITAS PENYELENGGARA */}
        <div className="mb-6">
          <h3 className="font-bold bg-slate-100 p-2 border-l-4 border-emerald-600 mb-4">
            II. INFORMASI TENTANG IDENTITAS PENYELENGGARA PROGRAM<br/>
            <span className="text-xs italic text-slate-500 font-normal">Information Identifying the Awarding Institution</span>
          </h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="w-56 py-1">Perguruan Tinggi<br/><span className="italic text-slate-500 text-xs">Awarding Institution</span></td>
                <td className="w-4 align-top py-1">:</td>
                <td className="uppercase font-bold align-top py-1">Sekolah Tinggi Ilmu Manajemen Indonesia (STIMI) YAPMI Makassar</td>
              </tr>
              <tr>
                <td className="py-1">Status Akreditasi<br/><span className="italic text-slate-500 text-xs">Accreditation Status</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">Baik Sekali (Keputusan LAMEMBA No. 933/DE/A.5/AR.10/XII/2023)<br/><span className="italic text-slate-500 text-xs">Excellent Accreditation</span></td>
              </tr>
              <tr>
                <td className="py-1">Program Studi<br/><span className="italic text-slate-500 text-xs">Study Program</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">S1 Manajemen<br/><span className="italic text-slate-500 text-xs">Management</span></td>
              </tr>
              <tr>
                <td className="py-1">Jenis Pendidikan<br/><span className="italic text-slate-500 text-xs">Type of Education</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">Akademik<br/><span className="italic text-slate-500 text-xs">Academic</span></td>
              </tr>
              <tr>
                <td className="py-1">Program Pendidikan Tinggi<br/><span className="italic text-slate-500 text-xs">Higher Education Program</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">Sarjana Strata 1 (S1) - Kerangka Kualifikasi Nasional Indonesia (KKNI) Level 6<br/><span className="italic text-slate-500 text-xs">Bachelor Degree - Indonesian Qualification Framework (IQF) Level 6</span></td>
              </tr>
              <tr>
                <td className="py-1">Bahasa Pengantar<br/><span className="italic text-slate-500 text-xs">Language of Instruction</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">Bahasa Indonesia<br/><span className="italic text-slate-500 text-xs">Indonesian</span></td>
              </tr>
              <tr>
                <td className="py-1">Sistem Penilaian<br/><span className="italic text-slate-500 text-xs">Grading System</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">A = 4.00, A- = 3.75, B+ = 3.50, B = 3.00, B- = 2.75, C+ = 2.50, C = 2.00, E = 0.00</td>
              </tr>
              <tr>
                <td className="py-1">Jenis & Jenjang Pendidikan Lanjutan<br/><span className="italic text-slate-500 text-xs">Access to Further Study</span></td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1">-</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* HALAMAN 2: HASIL YANG DICAPAI */}
      <div className="page-break max-w-[21cm] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none p-[1.5cm] min-h-[29.7cm] mt-8 print:mt-0 relative box-border flex flex-col">
        
        {/* III. CAPAIAN PEMBELAJARAN & TRANSKRIP */}
        <div className="flex-1">
          <h3 className="font-bold bg-slate-100 p-2 border-l-4 border-emerald-600 mb-4 text-sm">
            III. INFORMASI TENTANG KUALIFIKASI DAN HASIL YANG DICAPAI<br/>
            <span className="text-xs italic text-slate-500 font-normal">Information Identifying the Qualification and Outcomes</span>
          </h3>

          <div className="text-sm mb-4">
            <h4 className="font-bold">A. Capaian Pembelajaran Lulusan (CPL) & Mata Kuliah (CPMK) / <span className="italic font-normal text-slate-500">Learning & Course Outcomes</span></h4>
            <div className="pl-4 mt-2">
              <p className="text-justify mb-2 text-slate-700 italic">Capaian Pembelajaran Mata Kuliah (CPMK) terdistribusi secara spesifik ke dalam mata kuliah konversi yang tertera pada transkrip di bawah. Keseluruhan CPMK tersebut bermuara pada pencapaian CPL Program Studi sebagai berikut:</p>
              
              <p className="font-bold mb-1 mt-3">1. Sikap / <span className="italic font-normal">Attitudes</span></p>
              <p className="text-justify mb-2">Bertakwa kepada Tuhan YME, menjunjung tinggi nilai kemanusiaan, etika profesional, dan menunjukkan sikap bertanggung jawab atas pekerjaan di bidang keahliannya secara mandiri.</p>
              
              <p className="font-bold mb-1">2. Penguasaan Pengetahuan / <span className="italic font-normal">Knowledge</span></p>
              <p className="text-justify mb-2">Menguasai konsep teoretis ilmu manajemen dan fungsi-fungsi bisnis (SDM, pemasaran, operasional, keuangan) serta penyelesaian masalah manajerial secara sistematis.</p>

              <p className="font-bold mb-1">3. Keterampilan / <span className="italic font-normal">Skills</span></p>
              <p className="text-justify mb-2">Mampu mengambil keputusan manajerial yang tepat di berbagai tipe organisasi dengan memanfaatkan teknologi informasi, serta mampu mengelola kerja sama tim dengan baik.</p>
            </div>
          </div>

          <div className="text-sm mb-4">
            <h4 className="font-bold mb-2">B. Transkrip Konversi Nilai Magang Berdampak / <span className="italic font-normal text-slate-500">Impactful Internship Conversion Transcript</span></h4>
            
            <table className="w-full border-collapse border border-black text-xs mb-4 text-center mt-4">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black py-2 px-2 w-10">No</th>
                  <th className="border border-black py-2 px-2 w-20">Kode MK<br/><span className="italic text-[10px] font-normal">Code</span></th>
                  <th className="border border-black py-2 px-2 text-left">Mata Kuliah Konversi<br/><span className="italic text-[10px] font-normal">Course</span></th>
                  <th className="border border-black py-2 px-2 w-12">SKS<br/><span className="italic text-[10px] font-normal">Credit</span></th>
                  <th className="border border-black py-2 px-2 w-16">Nilai<br/><span className="italic text-[10px] font-normal">Grade</span></th>
                  <th className="border border-black py-2 px-2 w-16">Huruf<br/><span className="italic text-[10px] font-normal">Index</span></th>
                </tr>
              </thead>
              <tbody>
                {isDinilai ? transkrip.map((mk, idx) => (
                  <tr key={idx}>
                    <td className="border border-black py-1.5 px-2">{idx + 1}</td>
                    <td className="border border-black py-1.5 px-2">{mk.kode_mk}</td>
                    <td className="border border-black py-1.5 px-2 text-left">{mk.nama_mk}</td>
                    <td className="border border-black py-1.5 px-2">{mk.sks}</td>
                    <td className="border border-black py-1.5 px-2 font-bold">{mk.nilai_angka.toFixed(2)}</td>
                    <td className="border border-black py-1.5 px-2 font-bold">{mk.nilai_huruf}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="border border-black py-6 px-3 text-center text-slate-500 italic">
                      Penilaian komprehensif sedang dalam proses verifikasi.
                    </td>
                  </tr>
                )}
              </tbody>
              {isDinilai && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan="3" className="border border-black py-2 px-2 text-right">Total SKS Konversi Diakui / <span className="italic font-normal text-[10px]">Total Recognized Credits</span></td>
                    <td className="border border-black py-2 px-2 text-center">{totalSKS}</td>
                    <td colSpan="2" className="border border-black py-2 px-2 uppercase bg-emerald-50"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* HALAMAN 3: PRESTASI & PENGESAHAN */}
      <div className="page-break max-w-[21cm] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none p-[1.5cm] min-h-[29.7cm] mt-8 print:mt-0 relative box-border flex flex-col">
        
        <div className="flex-1">
          {/* IV. PRESTASI DAN REKAM JEJAK */}
          <div className="mb-8">
            <h3 className="font-bold bg-slate-100 p-2 border-l-4 border-emerald-600 mb-4 text-sm">
              IV. INFORMASI TAMBAHAN (PRESTASI DAN REKAM JEJAK)<br/>
              <span className="text-xs italic text-slate-500 font-normal">Additional Information (Achievements and Track Record)</span>
            </h3>

            <div className="text-sm border border-slate-300 p-4 rounded-lg bg-emerald-50/50">
              <h4 className="font-bold text-emerald-800 mb-2 uppercase">Aktivitas Praktik Industri Terverifikasi</h4>
              <p className="text-justify mb-2">Pemegang SKPI ini telah berhasil menyelesaikan program <strong>Magang Berdampak Berbasis Outcome-Based Education (OBE)</strong> selama 1 semester penuh yang setara dengan akumulasi 20 SKS.</p>
              
              <table className="w-full text-sm mt-4 mb-2">
                <tbody>
                  <tr>
                    <td className="w-48 py-1">Lokasi Magang / Industri<br/><span className="italic text-slate-500 text-xs">Host Company</span></td>
                    <td className="w-4 align-top py-1">:</td>
                    <td className="uppercase font-bold align-top py-1">{mitra}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Predikat Kinerja<br/><span className="italic text-slate-500 text-xs">Performance Predicate</span></td>
                    <td className="align-top py-1">:</td>
                    <td className="uppercase font-bold text-emerald-700 align-top py-1">{predikat}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Penilaian & Verifikasi<br/><span className="italic text-slate-500 text-xs">Assessment & Verification</span></td>
                    <td className="align-top py-1">:</td>
                    <td className="align-top py-1 text-justify">
                      Telah diverifikasi kemampuannya secara teknis dan profesional oleh Mentor Industri di lapangan, serta memenuhi indikator kinerja (KPI) yang ditetapkan oleh Dosen Pembimbing Lapangan.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PENGESAHAN */}
        <div className="w-full mt-12">
          <div className="flex justify-between items-end">
            <div className="w-1/3">
              {typeof window !== 'undefined' && data?.laporan?._id && (
                <div className="w-24 h-24 border border-slate-300 p-1 bg-white mb-2 flex items-center justify-center">
                  <QRCode value={`${window.location.origin}/validasi/transkrip/${data.laporan._id}`} size={86} />
                </div>
              )}
              <p className="text-xs font-bold text-slate-800">Verifikasi Digital Pangkalan Data</p>
              <p className="text-[10px] text-slate-500 italic">Scan untuk memastikan keaslian dokumen di platform MANTAU MAGANG STIMI YAPMI Makassar.</p>
            </div>
            
            <div className="w-1/3 text-center text-sm flex flex-col items-center">
              <p className="mb-1">Makassar, {new Date(pengajuan.tanggal_selesai).toLocaleDateString('id-ID')}</p>
              <p className="font-bold">{config?.jabatan_pejabat || 'Ketua Program Studi Manajemen'}</p>
              <div className="my-4 inline-flex flex-col items-center justify-center">
              {typeof window !== 'undefined' && data?.laporan?._id && (
                <QRCode value={`${window.location.origin}/validasi/transkrip/${data.laporan._id}`} size={48} />
              )}
              </div>
              <p className="font-bold underline uppercase">{config?.nama_pejabat_pengesah || '........................................'}</p>
              <p className="text-xs mt-1">NIDN. {config?.nidn_pejabat || '........................................'}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
