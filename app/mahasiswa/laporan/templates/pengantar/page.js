"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import QRCode from 'react-qr-code';

export default function CetakPengantar() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [posisiData, setPosisiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch("/api/config").then(res=>res.json()).then(c=>{if(c)setConfig(c)}).catch(console.error);

    if (session?.user?.id) {
      const urlParams = new URLSearchParams(window.location.search);
      const posisiId = urlParams.get('posisiId');
      const pengajuanId = urlParams.get('pengajuanId');

      if (pengajuanId) {
        // Jika ada pengajuanId (dari dashboard admin / mhs yang sudah disetujui)
        fetch(`/api/pengajuan?pengajuanId=${pengajuanId}`)
          .then(res => res.json())
          .then(d => {
            if (d) setData({ pengajuan: d });
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else if (posisiId) {
        fetch("/api/config").then(res=>res.json()).then(c=>{if(c)setConfig(c)});
      // Fetch specific posisi data for preview during application
        fetch(`/api/posisi?posisiId=${posisiId}`)
          .then(res => res.json())
          .then(d => {
            setPosisiData(d);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else {
        // Fetch existing pengajuan data for after application (fallback)
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

  // Jika data.pengajuan.mahasiswa_id ada (populate dari DB), gunakan itu. Jika tidak ada, gunakan session.
  const mhs = data?.pengajuan?.mahasiswa_id || session?.user;
  let mitra = ".......................................................";
  let alamatMitra = ".......................................................";
  let tanggalMulai = new Date();
  let tanggalSelesai = new Date();
  let namaDpl = "........................................";
  let nidnDpl = "....................";
  let nomorSurat = "......../STIMI/................/20....";
  let tanggalSurat = "............................";

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
    if (data.pengajuan.dpl_id) {
       namaDpl = data.pengajuan.dpl_id.nama_lengkap || "........................................";
       nidnDpl = data.pengajuan.dpl_id.nidn || data.pengajuan.dpl_id.nim_nidn || "....................";
    }
    if (data.pengajuan.nomor_surat_pengantar) {
       nomorSurat = data.pengajuan.nomor_surat_pengantar;
    } else if (data.pengajuan._id) {
       nomorSurat = `MANTAU-${new Date(data.pengajuan.updatedAt || new Date()).getFullYear()}-${data.pengajuan._id.slice(-6).toUpperCase()}`;
    }
    
    if (data.pengajuan.updatedAt) {
      tanggalSurat = new Date(data.pengajuan.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      tanggalSurat = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  return (
    <div className="bg-slate-200 min-h-screen font-serif text-black text-[11pt]">
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>
      <div className="fixed top-5 right-5 print:hidden">
        <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700">
          🖨️ Cetak PDF
        </button>
      </div>

      <div className="max-w-[21cm] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none">
        <div className="p-[2.5cm] min-h-[29.7cm] print:pt-[2cm] print:pr-[2cm] print:pb-[2.5cm] print:pl-[2.5cm] print:min-h-0">
          
          {/* KOP SURAT KAMPUS */}
          <div className="border-b-[3px] border-black pb-3 mb-3 text-center flex items-center justify-center gap-5">
            <img src="/logo_stimi.png" alt="Logo" className="h-20 object-contain" />
            <div className="text-center">
              <h1 className="text-lg font-black uppercase tracking-wider">SEKOLAH TINGGI ILMU MANAJEMEN INDONESIA (STIMI) YAPMI MAKASSAR</h1>
              <p className="text-xs mt-1">Jl. Perintis Kemerdekaan No.KM. 9, Tamalanrea, Makassar | Website: www.stimi-yapmi.ac.id | Email: info@stimi-yapmi.ac.id</p>
            </div>
          </div>

          <div className="flex justify-between mb-4">
            <div>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="w-24">Nomor</td>
                    <td className="w-4">:</td>
                    <td>{nomorSurat}</td>
                  </tr>
                  <tr>
                    <td>Lampiran</td>
                    <td>:</td>
                    <td>1 (Satu) Berkas</td>
                  </tr>
                  <tr>
                    <td>Perihal</td>
                    <td>:</td>
                    <td className="font-bold underline">Permohonan Izin Magang Berdampak</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <p>Makassar, {tanggalSurat}</p>
            </div>
          </div>

          <div className="mb-4">
            <p>Kepada Yth,</p>
            <p className="font-bold">Pimpinan {mitra}</p>
            <p>{alamatMitra}</p>
            <p>di - Tempat</p>
          </div>

          <div className="text-justify leading-relaxed space-y-3 mb-6">
            <p>Dengan hormat,</p>
            <p>
              Dalam rangka meningkatkan pemahaman praktis dan kompetensi mahasiswa di dunia kerja nyata, maka kami memohon kesediaan Bapak/Ibu untuk dapat menerima mahasiswa kami melaksanakan kegiatan <strong>Magang Berdampak</strong> di instansi/perusahaan yang Bapak/Ibu pimpin.
            </p>
            <p>
              <strong>Magang Berdampak</strong> adalah program unggulan kami yang dirancang agar mahasiswa tidak hanya sekadar belajar, tetapi juga didorong untuk memberikan kontribusi nyata. Kami sangat berharap kehadiran mahasiswa magang kami di tempat Bapak/Ibu dapat memberikan dampak yang positif, inovatif, dan bermanfaat secara langsung bagi instansi/perusahaan yang Bapak/Ibu pimpin.
            </p>
            <p>Adapun mahasiswa yang bersangkutan terlampir pada halaman kedua surat ini.</p>
            
            <p className="mt-4">
              Rencana pelaksanaan kegiatan magang ini akan dilaksanakan selama <strong>4 (empat) bulan</strong>, terhitung mulai bulan <strong>{tanggalMulai.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</strong> sampai dengan <strong>{tanggalSelesai.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</strong>.
            </p>
            <p>
              Demikian surat permohonan ini kami sampaikan, atas perhatian dan kerjasama yang baik dari Bapak/Ibu kami ucapkan terima kasih.
            </p>
          </div>

          <div className="flex justify-end mt-4 text-center">
            <div className="w-1/2 flex flex-col items-end text-right">
              <p>{config?.jabatan_pejabat || 'Ketua Program Studi Manajemen'}</p>
              <div className="my-4 inline-flex flex-col items-center justify-center">
                {typeof window !== 'undefined' && data?.pengajuan?._id && (
                  <QRCode value={`${window.location.origin}/validasi/pengantar/${data.pengajuan._id}`} size={56} />
                )}
              </div>
              <p className="font-bold underline uppercase">{config?.nama_pejabat_pengesah || '....................................................'}</p>
              <p>NIDN. {config?.nidn_pejabat || '....................................'}</p>
            </div>
          </div>

        </div>

        {data?.pengajuan?.peserta_grup && data.pengajuan.peserta_grup.length > 0 && (
          <div className="p-[2.5cm] min-h-[29.7cm] print:pt-[2cm] print:pr-[2cm] print:pb-[2.5cm] print:pl-[2.5cm] print:min-h-0 page-break-before-always" style={{ pageBreakBefore: 'always' }}>
            <h3 className="text-center font-bold mb-6 underline">LAMPIRAN SURAT PENGANTAR MAGANG</h3>
            <div className="mb-4">
              <table className="w-full text-left">
                <tbody>
                  <tr>
                    <td className="w-40">Nomor Surat</td>
                    <td className="w-4">:</td>
                    <td>{nomorSurat}</td>
                  </tr>
                  <tr>
                    <td>Tujuan Instansi</td>
                    <td>:</td>
                    <td>{mitra}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="mb-2 font-bold">Daftar Mahasiswa:</p>
            <table className="w-full border-collapse border border-black mb-8 text-[10pt]">
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th className="border border-black p-2 w-10">No</th>
                  <th className="border border-black p-2">Nama Mahasiswa</th>
                  <th className="border border-black p-2">NIM</th>
                  <th className="border border-black p-2">Program Studi</th>
                  <th className="border border-black p-2">Dosen Pembimbing Lapangan (DPL)</th>
                </tr>
              </thead>
              <tbody>
                {data.pengajuan.peserta_grup.map((p, idx) => (
                  <tr key={p._id}>
                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                    <td className="border border-black p-2 font-bold">{p.mahasiswa_id?.nama_lengkap}</td>
                    <td className="border border-black p-2">{p.mahasiswa_id?.nim_nidn}</td>
                    <td className="border border-black p-2 text-center">
                      {(p.mahasiswa_id?.program_studi || 'Manajemen').replace(/\(S1\)/i, '').trim()} <br/>
                      {p.mahasiswa_id?.konsentrasi ? `(${p.mahasiswa_id?.konsentrasi})` : ''}
                    </td>
                    <td className="border border-black p-2">
                      <strong className="whitespace-nowrap">{p.dpl_id?.nama_lengkap || '-'}</strong><br/>
                      {p.dpl_id?.nidn || p.dpl_id?.nim_nidn || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-4 text-center">
              <div className="w-1/2 flex flex-col items-end text-right">
                <p>Makassar, {tanggalSurat}</p>
                <p>{config?.jabatan_pejabat || 'Ketua Program Studi Manajemen'}</p>
                <div className="my-4 inline-flex flex-col items-center justify-center">
                  {typeof window !== 'undefined' && data?.pengajuan?._id && (
                    <QRCode value={`${window.location.origin}/validasi/pengantar/${data.pengajuan._id}`} size={56} />
                  )}
                </div>
                <p className="font-bold underline uppercase">{config?.nama_pejabat_pengesah || '....................................................'}</p>
                <p>NIDN. {config?.nidn_pejabat || '....................................'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
