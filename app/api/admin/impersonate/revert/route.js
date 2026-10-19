import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import ImpersonationToken from '@/models/ImpersonationToken';
import crypto from 'crypto';

export async function POST(req) {
  await connectToDatabase();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.impersonatedBy?.id) {
      return NextResponse.json({ error: "Tidak ada sesi impersonasi aktif yang dapat dikembalikan." }, { status: 400 });
    }

    const adminId = session.user.impersonatedBy.id;
    const adminUser = await User.findById(adminId);
    if (!adminUser) {
      return NextResponse.json({ error: "Akun Admin asli tidak ditemukan." }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString('hex');

    // Bersihkan token lama jika ada
    await ImpersonationToken.deleteMany({ admin_id: adminId });

    await ImpersonationToken.create({
      token,
      admin_id: adminId,
      admin_name: adminUser.nama_lengkap,
      admin_role: adminUser.role,
      target_user_id: adminUser._id, // Target kembali ke akun admin sendiri
      type: 'revert',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    return NextResponse.json({ 
      ok: true, 
      revertToken: token,
      adminName: adminUser.nama_lengkap 
    });
  } catch (error) {
    console.error("Error creating revert token:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
