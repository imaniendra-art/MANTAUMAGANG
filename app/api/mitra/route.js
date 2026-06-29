import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MitraMagang from '@/models/MitraMagang';
import PosisiMagang from '@/models/PosisiMagang'; // for cascade delete

export async function GET() {
  await dbConnect();
  try {
    const mitra = await MitraMagang.aggregate([
      {
        $lookup: {
          from: "posisimagangs",
          localField: "_id",
          foreignField: "mitra_id",
          as: "posisi_list"
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    return NextResponse.json(mitra);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const data = await req.json();
    const newMitra = await MitraMagang.create(data);
    return NextResponse.json(newMitra, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    const data = await req.json();
    const { id, ...updateData } = data;
    if (!id) return NextResponse.json({ error: "ID Mitra diperlukan" }, { status: 400 });

    const updatedMitra = await MitraMagang.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedMitra) return NextResponse.json({ error: "Mitra tidak ditemukan" }, { status: 404 });

    return NextResponse.json(updatedMitra);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID Mitra diperlukan" }, { status: 400 });

    const deletedMitra = await MitraMagang.findByIdAndDelete(id);
    if (!deletedMitra) return NextResponse.json({ error: "Mitra tidak ditemukan" }, { status: 404 });

    // Cascade delete PosisiMagang
    await PosisiMagang.deleteMany({ mitra_id: id });

    return NextResponse.json({ message: "Mitra dan posisi terkait berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
