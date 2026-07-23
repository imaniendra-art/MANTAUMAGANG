import React from 'react';
import dbConnect from '@/lib/db';
import PengajuanMagang from '@/models/PengajuanMagang';
import LaporanAkhir from '@/models/LaporanAkhir';
import User from '@/models/User';
import AppConfig from '@/models/AppConfig';

export default async function ValidasiDigitalPage({ params }) {
  const { type, id } = await params;
  
  await dbConnect();
  
  let valid = false;
  let dokumen = null;
  let config = await AppConfig.findOne();

  const kaprodi = config?.nama_pejabat_pengesah || 'Ketua Program Studi';

  try {
    if (type === 'pengantar') {
      const pengajuan = await PengajuanMagang.findById(id)
        .populate('mahasiswa_id', 'nama_lengkap nim_nidn')
        .populate('dpl_id', 'nama_lengkap nidn')
        .lean();
        
      if (pengajuan && pengajuan.status_pengajuan === 'disetujui') {
        valid = true;
        dokumen = {
          judul: "Surat Pengantar Magang",
          nama_mahasiswa: pengajuan.mahasiswa_id?.nama_lengkap,
          nim: pengajuan.mahasiswa_id?.nim_nidn,
          disahkan_oleh: kaprodi,
          tanggal: pengajuan.updatedAt,
          nomor_surat: pengajuan.nomor_surat_pengantar || `MANTAU-${new Date(pengajuan.updatedAt || new Date()).getFullYear()}-${pengajuan._id.toString().slice(-6).toUpperCase()}`
        };
      }
    } else if (['pengesahan', 'transkrip', 'sertifikat', 'penilaian-dpl', 'penilaian-mentor'].includes(type)) {
      const laporan = await LaporanAkhir.findById(id)
        .populate('mahasiswa_id', 'nama_lengkap nim_nidn')
        .populate({
          path: 'pengajuan_id',
          populate: [
            { path: 'mentor_id', select: 'nama_lengkap' },
            { path: 'dpl_id', select: 'nama_lengkap' }
          ]
        })
        .lean();
        
      // Asumsikan laporan disetujui jika status submitted
      if (laporan && (laporan.status_validasi_dpl === 'disetujui' || laporan.status === 'submitted' || laporan.status === 'disetujui')) {
        valid = true;
        let judulDokumen = "";
        let disahkanOleh = kaprodi;
        const ketuaInstitusi = config?.nama_ketua_institusi || "Dr. Ibrahim Syah, S.E.,M.M";
        
        if (type === 'transkrip') {
          judulDokumen = "Transkrip Nilai (SKPI)";
        } else if (type === 'pengesahan') {
          judulDokumen = "Lembar Pengesahan Laporan";
          disahkanOleh = (laporan.pengajuan_id?.dpl_id?.nama_lengkap || "DPL") + " & " + kaprodi;
        } else if (type === 'sertifikat') {
          judulDokumen = "Sertifikat Magang Berdampak";
          disahkanOleh = ketuaInstitusi;
        } else if (type === 'penilaian-dpl') {
          judulDokumen = "Daftar Penilaian Magang (DPL)";
          disahkanOleh = laporan.pengajuan_id?.dpl_id?.nama_lengkap || "Dosen Pembimbing Lapangan";
        } else if (type === 'penilaian-mentor') {
          judulDokumen = "Daftar Penilaian Magang (Mentor)";
          disahkanOleh = laporan.pengajuan_id?.mentor_id?.nama_lengkap || "Mentor Industri";
        }

        dokumen = {
          judul: judulDokumen,
          nama_mahasiswa: laporan.mahasiswa_id?.nama_lengkap,
          nim: laporan.mahasiswa_id?.nim_nidn,
          disahkan_oleh: disahkanOleh,
          tanggal: laporan.updatedAt,
          nomor_surat: laporan.nomor_sertifikat || `MANTAU-${new Date(laporan.updatedAt || new Date()).getFullYear()}-${laporan._id.toString().slice(-6).toUpperCase()}`
        };
      }
    }
  } catch (e) {
    console.error(e);
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border-t-8 border-red-500">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl">❌</div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">Dokumen Tidak Valid</h1>
          <p className="text-slate-500 mb-4">Barcode yang Anda scan tidak dikenali, atau dokumen belum disetujui secara resmi oleh sistem.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="bg-emerald-600 p-6 text-center text-white">
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm">✅</div>
          </div>
          <h1 className="text-2xl font-black tracking-wide">DOKUMEN VALID</h1>
          <p className="opacity-80 text-sm mt-1">Keaslian dokumen terverifikasi</p>
        </div>
        
        <div className="p-8">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Jenis Dokumen</p>
              <p className="text-lg font-bold text-slate-800">{dokumen.judul}</p>
            </div>
            
            {dokumen.nomor_surat && (
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nomor Dokumen</p>
                <p className="font-semibold text-slate-700">{dokumen.nomor_surat}</p>
              </div>
            )}
            
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Diterbitkan Untuk</p>
              <p className="font-semibold text-slate-700">{dokumen.nama_mahasiswa}</p>
              <p className="text-sm text-slate-500">NIM: {dokumen.nim}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Penandatangan Digital</p>
              <p className="font-semibold text-slate-700">{dokumen.disahkan_oleh}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tanggal Pengesahan</p>
              <p className="font-semibold text-slate-700">
                {new Date(dokumen.tanggal).toLocaleDateString('id-ID', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Sistem Informasi MANTAU MAGANG<br/>
              STIMI YAPMI Makassar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
