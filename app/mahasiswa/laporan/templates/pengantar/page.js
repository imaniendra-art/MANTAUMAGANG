"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CetakPengantar() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [posisiData, setPosisiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      const urlParams = new URLSearchParams(window.location.search);
      const posisiId = urlParams.get('posisiId');

      if (posisiId) {
        // Fetch specific posisi data for preview during application
        fetch(`/api/posisi?posisiId=${posisiId}`)
          .then(res => res.json())
          .then(d => {
            setPosisiData(d);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else {
        // Fetch existing pengajuan data for after application
        fetch(`/api/laporan-akhir?mhsId=${session.user.id}`)
          .then(res => res.json())
          .then(d => {
            if (d.laporan && d.pengajuan) {
              setData(d);
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    }
  }, [session]);

  if (loading) return <div className="p-10 text-center">Memuat dokumen...</div>;
  if (!data && !posisiData) return <div className="p-10 text-center text-red-500 font-bold">Data tidak ditemukan. Pastikan Anda sudah login dan memiliki data pengajuan/posisi.</div>;

  const mhs = session?.user;
  let mitra = ".......................................................";
  let alamatMitra = ".......................................................";
  let tanggalMulai = new Date();
  let tanggalSelesai = new Date();

  if (posisiData) {
    mitra = posisiData.mitra_id?.nama_instansi || ".......................................................";
    alamatMitra = posisiData.mitra_id?.alamat || ".......................................................";
    // Default to current date and 3 months later if not yet submitted
    tanggalSelesai.setMonth(tanggalSelesai.getMonth() + 3);
  } else if (data?.pengajuan) {
    mitra = data.pengajuan.mitra_id?.nama_perusahaan || data.pengajuan.detail_tempat?.nama || ".......................................................";
    alamatMitra = data.pengajuan.detail_tempat?.alamat || ".......................................................";
    tanggalMulai = new Date(data.pengajuan.tanggal_mulai || new Date());
    tanggalSelesai = new Date(data.pengajuan.tanggal_selesai || new Date(tanggalMulai).setMonth(tanggalMulai.getMonth() + 3));
  }

  return (
    <div className="bg-slate-200 min-h-screen font-serif text-black">
      <div className="fixed top-5 right-5 print:hidden">
        <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700">
          🖨️ Cetak PDF
        </button>
      </div>

      <div className="max-w-[21cm] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none">
        <div className="p-[3cm] min-h-[29.7cm] print:p-[2.5cm]">
          
          {/* KOP SURAT KAMPUS (DUMMY) */}
          <div className="border-b-4 border-black pb-4 mb-8 text-center flex items-center justify-center gap-4">
            <img src="/logo_stimi.png" alt="Logo" className="h-24 object-contain" />
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide">SEKOLAH TINGGI ILMU MANAJEMEN INDONESIA</h1>
              <h2 className="text-2xl font-black uppercase tracking-wider">STIMI YAPMI MAKASSAR</h2>
              <p className="text-sm">Jl. Perintis Kemerdekaan No.KM. 9, Tamalanrea, Makassar</p>
              <p className="text-sm">Website: www.stimi-yapmi.ac.id | Email: info@stimi-yapmi.ac.id</p>
            </div>
          </div>

          <div className="flex justify-between mb-8">
            <div>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="w-24">Nomor</td>
                    <td className="w-4">:</td>
                    <td>......../STIMI/................/20....</td>
                  </tr>
                  <tr>
                    <td>Lampiran</td>
                    <td>:</td>
                    <td>1 (Satu) Berkas</td>
                  </tr>
                  <tr>
                    <td>Perihal</td>
                    <td>:</td>
                    <td className="font-bold underline">Permohonan Izin Magang</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <p>Makassar, ............................</p>
            </div>
          </div>

          <div className="mb-8">
            <p>Kepada Yth,</p>
            <p className="font-bold">Pimpinan {mitra}</p>
            <p>{alamatMitra}</p>
            <p>di - Tempat</p>
          </div>

          <div className="text-justify leading-relaxed space-y-4 mb-8">
            <p>Dengan hormat,</p>
            <p>
              Dalam rangka meningkatkan pemahaman praktis dan kompetensi mahasiswa di dunia kerja nyata, maka kami memohon kesediaan Bapak/Ibu untuk dapat menerima mahasiswa kami melaksanakan kegiatan <strong>Magang Berdampak</strong> di instansi/perusahaan yang Bapak/Ibu pimpin.
            </p>
            <p>Adapun mahasiswa yang bersangkutan adalah:</p>
            
            <table className="w-full ml-8 border-collapse border border-black text-center mt-2 mb-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 w-12">No</th>
                  <th className="border border-black p-2">Nama</th>
                  <th className="border border-black p-2">NIM</th>
                  <th className="border border-black p-2">Program Studi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2">1</td>
                  <td className="border border-black p-2 font-bold">{mhs.nama_lengkap}</td>
                  <td className="border border-black p-2">{mhs.nim_nidn}</td>
                  <td className="border border-black p-2">Manajemen</td>
                </tr>
              </tbody>
            </table>

            <p>
              Rencana pelaksanaan kegiatan magang ini akan dilaksanakan pada tanggal <strong>{tanggalMulai.toLocaleDateString('id-ID')}</strong> sampai dengan <strong>{tanggalSelesai.toLocaleDateString('id-ID')}</strong>.
            </p>
            <p>
              Demikian surat permohonan ini kami sampaikan, atas perhatian dan kerjasama yang baik dari Bapak/Ibu kami ucapkan terima kasih.
            </p>
          </div>

          <div className="flex justify-end mt-16 text-center">
            <div className="w-1/2">
              <p>Ketua STIMI YAPMI Makassar,</p>
              <p className="mb-24 mt-2">(Stempel & Tanda Tangan)</p>
              <p className="font-bold underline">Ibrahim Syah., S.E., M.M.</p>
              <p>NIDN. 0914097401</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
