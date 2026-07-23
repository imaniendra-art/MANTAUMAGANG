import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req) {
  await dbConnect();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Tidak sah, silakan login" }, { status: 401 });
    }

    const { oldPassword, newPassword, nidn, nomor_hp, email, nama_lengkap, nim_nidn } = await req.json();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Perbarui password jika oldPassword dan newPassword diberikan
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Password lama salah" }, { status: 400 });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.isFirstLogin = false;
    } else if (oldPassword || newPassword) {
      return NextResponse.json({ error: "Password lama dan baru harus diisi untuk mengubah password" }, { status: 400 });
    }

    // Perbarui info profil jika diberikan
        if (nama_lengkap) user.nama_lengkap = nama_lengkap;
    if (nim_nidn) {
      const existingUser = await User.findOne({ nim_nidn });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return NextResponse.json({ error: "Username/ID sudah digunakan oleh pengguna lain" }, { status: 400 });
      }
      user.nim_nidn = nim_nidn;
    }
    if (nidn !== undefined) user.nidn = nidn;
    if (nomor_hp !== undefined) user.nomor_hp = nomor_hp;
    if (email !== undefined && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
        return NextResponse.json({ error: "Email sudah digunakan oleh pengguna lain" }, { status: 400 });
      }
      user.email = email;
    }

    await user.save();

    return NextResponse.json({ message: "Profil berhasil diperbarui" });
  } catch (error) {
    console.error("Error update profil:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
