import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MitraMagang from '@/models/MitraMagang';
import PosisiMagang from '@/models/PosisiMagang'; // for cascade delete

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const isPublic = searchParams.get('public') === 'true';

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

    if (isPublic) {
      // Check filled quotas
      const PengajuanMagang = (await import('@/models/PengajuanMagang')).default;
      const pengajuans = await PengajuanMagang.find({ 
        status_pengajuan: 'disetujui',
        is_dpl_confirmed: true 
      });

      const filledCounts = {};
      pengajuans.forEach(p => {
        if (p.posisi_id) {
          filledCounts[p.posisi_id] = (filledCounts[p.posisi_id] || 0) + 1;
        }
      });

      const filteredMitra = mitra.map(m => {
        m.posisi_list = m.posisi_list.filter(pos => {
          const filled = filledCounts[pos._id] || 0;
          return filled < pos.kuota;
        });
        return m;
      }).filter(m => m.posisi_list.length > 0);

      return NextResponse.json(filteredMitra);
    }

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
