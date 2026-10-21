import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PengajuanMagang from '@/models/PengajuanMagang';
import PaketMatkul from '@/models/PaketMatkul';
import LogAktivitas from '@/models/LogAktivitas';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  await dbConnect();
  try {
    const formData = await req.formData();
    
    const mahasiswa_id = formData.get('mahasiswa_id');
    const mitra_id = formData.get('mitra_id');
    const posisi_id = formData.get('posisi_id');
    const nomor_hp = formData.get('nomor_hp');
    const mitra_nama = formData.get('mitra_nama');
    const mitra_alamat = formData.get('mitra_alamat');
    const posisi_nama = formData.get('posisi_nama');
    
    const file_cv = formData.get('file_cv');
    let file_cv_path = '';

    if (file_cv && typeof file_cv === 'object') {
      const bytes = await file_cv.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Pastikan direktori public/uploads/cv/ ada secara fisik
      const fs = await import('fs');
      const path = await import('path');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'cv');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Gunakan nama unik berbasis timestamp dan nama file
      const fileName = `${Date.now()}-${file_cv.name}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.promises.writeFile(filePath, buffer);
      
      // Simpan path absolut publik
      file_cv_path = `/uploads/cv/${fileName}`;
    }

    const User = (await import('@/models/User')).default;
    
    // Pemetaan Paket Matkul berdasarkan konsentrasi mahasiswa
    let paket_matkul_id = formData.get('paket_matkul_id');
    if (!paket_matkul_id) {
      const mhsData = await User.findById(mahasiswa_id).select('konsentrasi program_studi');
      if (mhsData?.konsentrasi) {
        const matchedPaket = await PaketMatkul.findOne({
          $or: [
            { konsentrasi: mhsData.konsentrasi },
            { nama_paket: { $regex: new RegExp(mhsData.konsentrasi, 'i') } }
          ],
          jenis_skema: 'instansi'
        });
        if (matchedPaket) paket_matkul_id = matchedPaket._id;
      }
      if (!paket_matkul_id) {
        const instansiPaket = await PaketMatkul.findOne({ jenis_skema: 'instansi' });
        if (instansiPaket) paket_matkul_id = instansiPaket._id;
      }
      if (!paket_matkul_id) {
        const anyPaket = await PaketMatkul.findOne();
        if (anyPaket) paket_matkul_id = anyPaket._id;
      }
    }
    
    // Update nomor_hp if provided
    if (nomor_hp) {
      await User.findByIdAndUpdate(mahasiswa_id, { nomor_hp });
    }

    const Periode = (await import('@/models/Periode')).default;
    const activePeriode = await Periode.findOne({ is_active: true });
    const durasiBulan = activePeriode?.durasi_bulan || 4;

    const tglMulai = new Date();
    const tglSelesai = new Date();
    tglSelesai.setMonth(tglSelesai.getMonth() + durasiBulan);

    const pengajuan = await PengajuanMagang.create({
      mahasiswa_id,
      paket_matkul_id,
      mitra_id: mitra_id || undefined,
      posisi_id: posisi_id || undefined,
      file_cv_path,
      jenis_skema: 'instansi',
      detail_tempat: {
        nama: mitra_nama || 'Instansi Mitra',
        alamat: mitra_alamat || 'Alamat Mitra',
        posisi: posisi_nama || 'Posisi Magang'
      },
      tanggal_mulai: tglMulai,
      tanggal_selesai: tglSelesai,
      status_pengajuan: 'menunggu',
      tanggal_pengajuan: new Date()
    });
    
    // Insert ke Log Aktivitas
    const mhs = await User.findById(mahasiswa_id);
    if (mhs) {
      await LogAktivitas.create({
        mahasiswa_id: mhs._id,
        nama_mahasiswa: mhs.nama_lengkap || mhs.name,
        aktivitas: `${mhs.nama_lengkap || mhs.name} telah mengajukan magang di posisi ${posisi_nama || 'Posisi Magang'}`,
        status: 'menunggu'
      });
    }

    return NextResponse.json(pengajuan, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
