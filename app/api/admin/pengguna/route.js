export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import PengajuanMagang from '@/models/PengajuanMagang';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function isAuthorizedAdmin() {
  const session = await getServerSession(authOptions);
  return ['admin_prodi', 'super_admin', 'admin'].includes(session?.user?.role) || session?.user?.email === 'imaniendra@gmail.com';
}

export async function GET(req) {
  await dbConnect();
  try {
    if (!await isAuthorizedAdmin()) {
      return NextResponse.json({ error: "Unauthorized. Akses khusus Administrator." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'mahasiswa';
    
    // Auto-sync: Fix old data missing isFirstLogin
    if (role === 'mahasiswa') {
      await User.updateMany(
        { role: 'mahasiswa', isFirstLogin: { $exists: false } },
        { $set: { isFirstLogin: true } }
      );
    }
    
    let query = { role };
    if (role === 'admin_prodi') {
      // Ambil seluruh akun jajaran admin: admin_prodi, super_admin, admin
      query = { role: { $in: ['admin_prodi', 'super_admin', 'admin'] } };
    }
    
    let users = await User.find(query).sort({ createdAt: -1 }).lean();
    
    if (role === 'dpl') {
      users = await Promise.all(users.map(async (dpl) => {
        const pengajuans = await PengajuanMagang.find({ 
          dpl_id: dpl._id, 
          status_pengajuan: 'disetujui' 
        }).populate('mahasiswa_id', 'program_studi kegiatan').lean();
        
        const prodis = [...new Set(pengajuans.map(p => p.mahasiswa_id?.program_studi).filter(Boolean))].join(', ');
        const kegiatans = [...new Set(pengajuans.map(p => p.mahasiswa_id?.kegiatan).filter(Boolean))].join(', ');
        
        return { ...dpl, program_studi: prodis, kegiatan: kegiatans };
      }));
    } else if (role === 'mentor') {
      users = await Promise.all(users.map(async (mentor) => {
        const pengajuans = await PengajuanMagang.find({ 
          mentor_id: mentor._id 
        }).populate('mitra_id').populate('posisi_id').lean();
        
        const lokasis = [...new Set(pengajuans.map(p => p.posisi_id?.mitra_id?.nama_instansi || p.mitra_id?.nama_instansi || p.detail_tempat?.nama).filter(Boolean))].join(', ');
        const devisis = [...new Set(pengajuans.map(p => p.posisi_id?.nama_posisi || p.detail_tempat?.posisi).filter(Boolean))].join(', ');
        
        return { ...mentor, lokasi: lokasis, devisi: devisis };
      }));
    }
    
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    if (!await isAuthorizedAdmin()) {
      return NextResponse.json({ error: "Unauthorized. Akses khusus Admin Prodi." }, { status: 401 });
    }

    const data = await req.json();
    const { nim_nidn, nidn, nama_lengkap, nomor_hp, role, program_studi } = data;

    if (!nim_nidn || !nama_lengkap) {
      return NextResponse.json({ error: "NIM/ID dan Nama Lengkap wajib diisi" }, { status: 400 });
    }

    const targetRole = role || 'dpl';

    const session = await getServerSession(authOptions);
    const isSuperAdmin = session?.user?.role === 'super_admin' || session?.user?.email === 'imaniendra@gmail.com';
    if (targetRole === 'super_admin' && !isSuperAdmin) {
      return NextResponse.json({ error: "Hanya Super Admin yang dapat menambahkan akun Super Admin." }, { status: 403 });
    }

    // Nomor HP wajib untuk role selain mahasiswa
    if (targetRole !== 'mahasiswa' && !nomor_hp) {
      return NextResponse.json({ error: "Nomor HP wajib diisi" }, { status: 400 });
    }

    const cleanNim = nim_nidn.toString().trim();
    const existingUser = await User.findOne({ nim_nidn: cleanNim });

    if (existingUser) {
      return NextResponse.json({ error: "NIM/ID sudah terdaftar" }, { status: 400 });
    }

    if (data.email) {
      const existingEmail = await User.findOne({ email: data.email.trim() });
      if (existingEmail) {
        return NextResponse.json({ error: "Email sudah digunakan oleh akun lain" }, { status: 400 });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = targetRole === 'mentor' ? nomor_hp : cleanNim;
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const defaultEmail = targetRole === 'mahasiswa'
      ? `${cleanNim}@student.stimiyapmi.ac.id`
      : `${cleanNim}@mantau.local`;

    const newUser = await User.create({
      nama_lengkap: nama_lengkap.trim(),
      nim_nidn: cleanNim,
      nidn: nidn ? nidn.trim() : undefined,
      nomor_hp: nomor_hp ? nomor_hp.trim() : "",
      email: data.email ? data.email.trim() : defaultEmail,
      password: hashedPassword,
      role: targetRole,
      program_studi: targetRole === 'mahasiswa' ? (program_studi?.trim() || "Manajemen (S1)") : (program_studi?.trim() || undefined),
      isFirstLogin: true,
    });

    return NextResponse.json({ message: "Pengguna berhasil ditambahkan", user: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    if (!await isAuthorizedAdmin()) {
      return NextResponse.json({ error: "Unauthorized. Akses khusus Administrator." }, { status: 401 });
    }

    const session = await getServerSession(authOptions);
    const isSuperAdmin = session?.user?.role === 'super_admin' || session?.user?.email === 'imaniendra@gmail.com';

    const data = await req.json();
    const { id, action, ...updateData } = data;

    if (!id) return NextResponse.json({ error: "ID pengguna diperlukan" }, { status: 400 });

    if (action === 'reset_password') {
      const user = await User.findById(id);
      if (!user) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
      
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = user.role === 'mentor' ? user.nomor_hp : user.nim_nidn;
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
      
      user.password = hashedPassword;
      user.isFirstLogin = true; 
      await user.save();
      
      return NextResponse.json({ message: "Password berhasil direset ke Nomor HP/ID" });
    } else {
      // Jika mengubah role admin
      if (updateData.role) {
        if (!isSuperAdmin) {
          return NextResponse.json({ error: "Hanya Super Admin yang berhak mengubah tingkatan role admin." }, { status: 403 });
        }
        if (!['super_admin', 'admin_prodi', 'admin'].includes(updateData.role)) {
          return NextResponse.json({ error: "Role admin yang dipilih tidak valid." }, { status: 400 });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      if (!updatedUser) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
      return NextResponse.json({ message: "Data berhasil diperbarui", user: updatedUser });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    if (!await isAuthorizedAdmin()) {
      return NextResponse.json({ error: "Unauthorized. Akses khusus Administrator." }, { status: 401 });
    }

    const session = await getServerSession(authOptions);
    const isSuperAdmin = session?.user?.role === 'super_admin' || session?.user?.email === 'imaniendra@gmail.com';

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "ID pengguna diperlukan" }, { status: 400 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    if (session?.user?.id === targetUser._id.toString()) {
      return NextResponse.json({ error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif." }, { status: 400 });
    }

    if (targetUser.role === 'super_admin' && !isSuperAdmin) {
      return NextResponse.json({ error: "Hanya Super Admin yang berhak menghapus akun Super Admin." }, { status: 403 });
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "Pengguna berhasil dihapus" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
