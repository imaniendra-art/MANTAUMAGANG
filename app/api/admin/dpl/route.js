import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import PengajuanMagang from '@/models/PengajuanMagang';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  await connectToDatabase();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'admin_prodi', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Ambil seluruh akun dengan role dpl
    const dpls = await User.find({ role: 'dpl' }).sort({ nama_lengkap: 1 }).lean();

    // Hitung mahasiswa bimbingan per DPL
    const dplIds = dpls.map(d => d._id);
    const pengajuans = await PengajuanMagang.find({
      dpl_id: { $in: dplIds },
      status_pengajuan: 'disetujui'
    })
      .populate('mahasiswa_id', 'nama_lengkap nim_nidn')
      .populate('mitra_id', 'nama_instansi')
      .lean();

    // Petakan mahasiswa ke masing-masing DPL
    const dplMap = {};
    dpls.forEach(d => {
      dplMap[d._id.toString()] = {
        ...d,
        password: undefined, // Sembunyikan hash password
        total_mahasiswa: 0,
        mahasiswa_bimbingan: []
      };
    });

    pengajuans.forEach(p => {
      const dId = p.dpl_id?.toString();
      if (dplMap[dId]) {
        dplMap[dId].total_mahasiswa += 1;
        dplMap[dId].mahasiswa_bimbingan.push({
          id: p._id,
          nama: p.mahasiswa_id?.nama_lengkap || 'Mahasiswa',
          nim: p.mahasiswa_id?.nim_nidn || '-',
          mitra: p.mitra_id?.nama_instansi || p.detail_tempat?.nama || '-'
        });
      }
    });

    return NextResponse.json(Object.values(dplMap));
  } catch (error) {
    console.error("Error fetching master DPL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await connectToDatabase();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'admin_prodi', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { nama_lengkap, nim_nidn, nidn, email, nomor_hp, password } = await req.json();

    if (!nama_lengkap || !nim_nidn) {
      return NextResponse.json({ error: "Nama Lengkap dan NIDN/Username wajib diisi." }, { status: 400 });
    }

    // Cek duplikasi
    const existing = await User.findOne({
      $or: [
        { nim_nidn: nim_nidn.trim() },
        ...(email ? [{ email: email.trim().toLowerCase() }] : [])
      ]
    });

    if (existing) {
      return NextResponse.json({ error: "NIDN/Username atau Email sudah terdaftar!" }, { status: 400 });
    }

    const finalPassword = password || nim_nidn.trim();
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    const newDpl = await User.create({
      nama_lengkap: nama_lengkap.trim(),
      nim_nidn: nim_nidn.trim(),
      nidn: (nidn || nim_nidn).trim(),
      email: (email || `${nim_nidn.trim()}@stimi-yapmi.ac.id`).toLowerCase(),
      nomor_hp: nomor_hp ? nomor_hp.trim() : "",
      password: hashedPassword,
      role: 'dpl',
      isFirstLogin: true
    });

    return NextResponse.json(newDpl, { status: 201 });
  } catch (error) {
    console.error("Error creating DPL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await connectToDatabase();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'admin_prodi', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, nama_lengkap, nim_nidn, nidn, email, nomor_hp, reset_password } = await req.json();
    if (!id) return NextResponse.json({ error: "ID wajib disertakan" }, { status: 400 });

    const updateData = {};
    if (nama_lengkap) updateData.nama_lengkap = nama_lengkap.trim();
    if (nim_nidn) updateData.nim_nidn = nim_nidn.trim();
    if (nidn) updateData.nidn = nidn.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (nomor_hp !== undefined) updateData.nomor_hp = nomor_hp.trim();

    if (reset_password) {
      // Default reset password adalah NIDN atau password123
      const pass = nim_nidn ? nim_nidn.trim() : 'password123';
      updateData.password = await bcrypt.hash(pass, 10);
      updateData.isFirstLogin = true;
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating DPL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectToDatabase();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'admin_prodi', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID wajib disertakan" }, { status: 400 });

    // Cek apakah ada mahasiswa yang sedang dibimbing oleh DPL ini
    const countActive = await PengajuanMagang.countDocuments({ dpl_id: id, status_pengajuan: 'disetujui' });
    if (countActive > 0) {
      return NextResponse.json({ 
        error: `Tidak dapat menghapus DPL ini karena masih memiliki ${countActive} mahasiswa bimbingan aktif. Silakan alihkan mahasiswa terlebih dahulu via menu Validasi Pengajuan.` 
      }, { status: 400 });
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ ok: true, message: "DPL berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting DPL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
