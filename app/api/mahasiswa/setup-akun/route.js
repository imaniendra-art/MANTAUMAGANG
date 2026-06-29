import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'mahasiswa') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { konsentrasi, kegiatan, nomor_hp, newPassword } = await req.json();

    if (!konsentrasi || !kegiatan || !nomor_hp || !newPassword) {
      return NextResponse.json({ message: 'Data tidak lengkap (Konsentrasi, Kegiatan, No HP & Password wajib diisi)' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Password minimal 6 karakter' }, { status: 400 });
    }

    await connectToDatabase();
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id, 
      {
        password: hashedPassword,
        konsentrasi: konsentrasi,
        kegiatan: kegiatan,
        nomor_hp: nomor_hp,
        isFirstLogin: false
      },
      { new: true }
    );

    console.log("Setup akun sukses:", updatedUser.nim_nidn);

    return NextResponse.json({ message: 'Profil dan password berhasil diubah' }, { status: 200 });
  } catch (error) {
    console.error('Setup akun error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
