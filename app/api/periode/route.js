import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Periode from '@/models/Periode';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  await dbConnect();
  try {
    const list = await Periode.find().sort({ createdAt: -1 });
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'admin_prodi'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { nama_periode, status_pendaftaran, batas_laporan } = await req.json();

    // Jika belum ada periode sama sekali, jadikan aktif otomatis
    const count = await Periode.countDocuments();
    const is_active = count === 0;

    const newPeriode = await Periode.create({
      nama_periode,
      status_pendaftaran: status_pendaftaran || 'Ditutup',
      batas_laporan: batas_laporan ? new Date(batas_laporan) : null,
      is_active
    });

    return NextResponse.json(newPeriode, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Nama periode sudah ada!" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'admin_prodi'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();

    // Skenario 1: Set Aktif (Hanya 1 yang boleh aktif)
    if (data.action === 'set_active') {
      const { id } = data;
      // Matikan semua
      await Periode.updateMany({}, { is_active: false });
      // Hidupkan yang diminta
      const updated = await Periode.findByIdAndUpdate(id, { is_active: true }, { new: true });
      return NextResponse.json(updated);
    }

    // Skenario 2: Update Data
    if (data.action === 'update_data') {
      const { id, status_pendaftaran, batas_laporan } = data;
      const updated = await Periode.findByIdAndUpdate(
        id, 
        { 
          status_pendaftaran, 
          batas_laporan: batas_laporan ? new Date(batas_laporan) : null 
        }, 
        { new: true }
      );
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'admin_prodi'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const deleted = await Periode.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted successfully", deleted });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
