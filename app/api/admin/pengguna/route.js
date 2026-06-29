import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

import PengajuanMagang from '@/models/PengajuanMagang';

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'mahasiswa';
    
    // Auto-sync: Fix old data missing isFirstLogin
    if (role === 'mahasiswa') {
      await User.updateMany(
        { role: 'mahasiswa', isFirstLogin: { $exists: false } },
        { $set: { isFirstLogin: true } }
      );
    }
    
    let users = await User.find({ role }).sort({ createdAt: -1 }).lean();
    
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
    const data = await req.json();
    const { nim_nidn, nama_lengkap, nomor_hp, role } = data;

    if (!nim_nidn || !nama_lengkap || !nomor_hp) {
      return NextResponse.json({ error: "NIDN/ID, Nama Lengkap, dan Nomor HP wajib diisi" }, { status: 400 });
    }

    const existingUser = await User.findOne({ nim_nidn });

    if (existingUser) {
      return NextResponse.json({ error: "NIDN/ID sudah terdaftar" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nim_nidn, salt);

    const newUser = await User.create({
      nama_lengkap,
      nim_nidn,
      nomor_hp,
      email: `${nim_nidn}@mantau.local`, // Auto-generate required email
      password: hashedPassword,
      role: role || 'dpl',
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
    const data = await req.json();
    const { id, action, ...updateData } = data;

    if (!id) return NextResponse.json({ error: "ID pengguna diperlukan" }, { status: 400 });

    if (action === 'reset_password') {
      const user = await User.findById(id);
      if (!user) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.nim_nidn, salt);
      
      user.password = hashedPassword;
      user.isFirstLogin = true; 
      await user.save();
      
      return NextResponse.json({ message: "Password berhasil direset ke NIM/NIDN" });
    } else {
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "ID pengguna diperlukan" }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Pengguna berhasil dihapus" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
