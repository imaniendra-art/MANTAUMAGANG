import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PosisiMagang from '@/models/PosisiMagang';

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const mitraId = searchParams.get('mitraId');
    const posisiId = searchParams.get('posisiId');
    
    if (posisiId) {
      const posisi = await PosisiMagang.findById(posisiId).populate('mitra_id', 'nama_instansi jenis_skema alamat deskripsi');
      if (!posisi) {
        return NextResponse.json({ error: "Posisi tidak ditemukan" }, { status: 404 });
      }
      return NextResponse.json(posisi);
    }

    let query = {};
    if (mitraId) {
      query.mitra_id = mitraId;
    }

    const posisi = await PosisiMagang.find(query)
      .populate('mitra_id', 'nama_instansi jenis_skema alamat')
      .sort({ createdAt: -1 });

    const isPublic = searchParams.get('public') === 'true';
    if (isPublic) {
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

      const availablePosisi = posisi.filter(pos => {
        const filled = filledCounts[pos._id] || 0;
        return filled < pos.kuota;
      });

      return NextResponse.json(availablePosisi);
    }
      
    return NextResponse.json(posisi);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const data = await req.json();
    const newPosisi = await PosisiMagang.create(data);
    return NextResponse.json(newPosisi, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    const data = await req.json();
    const { id, ...updateData } = data;
    if (!id) return NextResponse.json({ error: "ID Posisi diperlukan" }, { status: 400 });

    const updatedPosisi = await PosisiMagang.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedPosisi) return NextResponse.json({ error: "Posisi tidak ditemukan" }, { status: 404 });

    return NextResponse.json(updatedPosisi);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID Posisi diperlukan" }, { status: 400 });

    const deletedPosisi = await PosisiMagang.findByIdAndDelete(id);
    if (!deletedPosisi) return NextResponse.json({ error: "Posisi tidak ditemukan" }, { status: 404 });

    return NextResponse.json({ message: "Posisi berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
