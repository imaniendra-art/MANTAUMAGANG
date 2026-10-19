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
    const isAdmin = session && ['admin', 'admin_prodi'].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: "Hanya Admin yang memiliki otorisasi untuk melakukan impersonasi." }, { status: 403 });
    }

    const { dplId } = await req.json();
    if (!dplId) {
      return NextResponse.json({ error: "ID DPL wajib disertakan." }, { status: 400 });
    }

    const targetDpl = await User.findOne({ _id: dplId, role: 'dpl' });
    if (!targetDpl) {
      return NextResponse.json({ error: "Akun DPL target tidak ditemukan." }, { status: 404 });
    }

    // Generate single-use secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Bersihkan token lama untuk admin ini jika ada
    await ImpersonationToken.deleteMany({ admin_id: session.user.id });

    await ImpersonationToken.create({
      token,
      admin_id: session.user.id,
      admin_name: session.user.nama_lengkap || 'Admin',
      admin_role: session.user.role,
      target_user_id: targetDpl._id,
      type: 'impersonate',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    return NextResponse.json({ 
      ok: true, 
      impersonateToken: token,
      dplName: targetDpl.nama_lengkap 
    });
  } catch (error) {
    console.error("Error creating impersonation token:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
