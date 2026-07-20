import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import RencanaKerja from '@/models/RencanaKerja';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mhsId = searchParams.get('mhsId');

    if (!mhsId || session.user.id !== mhsId) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    await dbConnect();
    const rencanaKerja = await RencanaKerja.find({ mahasiswa_id: mhsId }).lean();
    
    return NextResponse.json(rencanaKerja);
  } catch (error) {
    console.error("GET RencanaKerja Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { mhsId, tanggal, teks } = body;

    if (!mhsId || session.user.id !== mhsId || !tanggal || !teks) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    // Upsert the RencanaKerja
    const updatedPlan = await RencanaKerja.findOneAndUpdate(
      { mahasiswa_id: mhsId, tanggal: tanggal },
      { teks: teks },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: 'Success', data: updatedPlan });
  } catch (error) {
    console.error("POST RencanaKerja Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
