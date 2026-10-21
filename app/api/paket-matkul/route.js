import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PaketMatkul from '@/models/PaketMatkul';

export async function GET() {
  await dbConnect();
  try {
    const paket = await PaketMatkul.find({}).sort({ konsentrasi: 1 });
    return NextResponse.json(paket);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const data = await req.json();
    
    if (data.action === 'add_indikator') {
      const { paketId, matkulId, cpmkId, indikator } = data;
      const paket = await PaketMatkul.findById(paketId);
      if (!paket) throw new Error("Paket tidak ditemukan");
      
      const matkul = paket.mata_kuliah.id(matkulId);
      if (!matkul) throw new Error("Mata kuliah tidak ditemukan");
      
      const cpmk = matkul.cpmk.id(cpmkId);
      if (!cpmk) throw new Error("CPMK tidak ditemukan");
      
      cpmk.indikator.push(indikator);
      await paket.save();
      
      return NextResponse.json(paket);
    }

    if (data.action === 'add_cpmk') {
      const { paketId, matkulId, nama_cpmk } = data;
      const paket = await PaketMatkul.findById(paketId);
      if (!paket) throw new Error("Paket tidak ditemukan");
      
      const matkul = paket.mata_kuliah.id(matkulId);
      if (!matkul) throw new Error("Mata kuliah tidak ditemukan");
      
      matkul.cpmk.push({ nama_cpmk, indikator: [] });
      await paket.save();
      
      return NextResponse.json(paket);
    }
    
    if (data.action === 'add_matkul') {
      const { paketId, kode, nama, sks, kategori = 'wajib', targetPaket } = data;
      
      // Jika dipilih 'all', tambahkan matkul ke semua paket yang ada (misal untuk matkul wajib)
      if (paketId === 'all' || targetPaket === 'all') {
        const pakets = await PaketMatkul.find({});
        for (const p of pakets) {
          const exists = p.mata_kuliah.some(m => m.kode.trim().toUpperCase() === kode.trim().toUpperCase());
          if (!exists) {
            p.mata_kuliah.push({ kode, nama, sks: Number(sks), kategori, cpmk: [] });
            await p.save();
          }
        }
        return NextResponse.json({ success: true, message: `Mata kuliah ditambahkan ke ${pakets.length} paket.` });
      }

      const paket = await PaketMatkul.findById(paketId);
      if (!paket) throw new Error("Paket tidak ditemukan");
      
      paket.mata_kuliah.push({ kode, nama, sks: Number(sks), kategori, cpmk: [] });
      await paket.save();
      
      return NextResponse.json(paket);
    }

    if (data.action === 'edit_matkul') {
      const { paketId, matkulId, kode, nama, sks, kategori, cpmk, oldKode } = data;
      const paket = await PaketMatkul.findById(paketId);
      if (!paket) throw new Error("Paket tidak ditemukan");
      
      let matkul = matkulId ? paket.mata_kuliah.id(matkulId) : null;
      if (!matkul && (oldKode || kode)) {
        matkul = paket.mata_kuliah.find(m => m.kode === (oldKode || kode));
      }
      if (!matkul) throw new Error("Mata kuliah tidak ditemukan");
      
      matkul.kode = kode;
      matkul.nama = nama;
      matkul.sks = Number(sks);
      if (kategori) {
        matkul.kategori = kategori;
      }
      
      if (cpmk !== undefined) {
        matkul.cpmk = cpmk;
      }
      
      await paket.save();
      
      return NextResponse.json(paket);
    }

    if (data.action === 'delete_matkul') {
      const { paketId, matkulId, kode } = data;
      const paket = await PaketMatkul.findById(paketId);
      if (!paket) throw new Error("Paket tidak ditemukan");
      
      let removed = false;
      if (matkulId && paket.mata_kuliah.id) {
        const item = paket.mata_kuliah.id(matkulId);
        if (item) {
          paket.mata_kuliah.pull(matkulId);
          removed = true;
        }
      }
      
      if (!removed && (kode || matkulId)) {
        const initialLen = paket.mata_kuliah.length;
        paket.mata_kuliah = paket.mata_kuliah.filter(m => {
          if (matkulId && m._id && m._id.toString() === matkulId.toString()) return false;
          if (kode && m.kode && m.kode.trim().toLowerCase() === kode.trim().toLowerCase()) return false;
          return true;
        });
        if (paket.mata_kuliah.length < initialLen) {
          removed = true;
        }
      }
      
      await paket.save();
      
      return NextResponse.json(paket);
    }

    if (data.action === 'delete_cpmk') {
      const { paketId, matkulId, cpmkId, kode } = data;
      const paket = await PaketMatkul.findById(paketId);
      if (!paket) throw new Error("Paket tidak ditemukan");
      
      let matkul = matkulId ? paket.mata_kuliah.id(matkulId) : null;
      if (!matkul && kode) {
        matkul = paket.mata_kuliah.find(m => m.kode === kode);
      }
      if (!matkul) throw new Error("Mata kuliah tidak ditemukan");
      
      let removed = false;
      if (cpmkId && matkul.cpmk?.id) {
        const item = matkul.cpmk.id(cpmkId);
        if (item) {
          matkul.cpmk.pull(cpmkId);
          removed = true;
        }
      }
      if (!removed && cpmkId && Array.isArray(matkul.cpmk)) {
        matkul.cpmk = matkul.cpmk.filter(c => c._id?.toString() !== cpmkId.toString());
      }
      
      await paket.save();
      
      return NextResponse.json(paket);
    }

    if (data.action === 'delete_indikator') {
      const { paketId, matkulId, cpmkId, indikatorIndex } = data;
      const paket = await PaketMatkul.findById(paketId);
      if (!paket) throw new Error("Paket tidak ditemukan");
      
      const matkul = paket.mata_kuliah.id(matkulId);
      if (!matkul) throw new Error("Mata kuliah tidak ditemukan");
      
      const cpmk = matkul.cpmk.id(cpmkId);
      if (!cpmk) throw new Error("CPMK tidak ditemukan");
      
      cpmk.indikator.splice(indikatorIndex, 1);
      await paket.save();
      
      return NextResponse.json(paket);
    }
    
    if (data.action === 'batch_import') {
      const { paketId, mata_kuliah_list, targetPaket } = data;
      
      // Jika paketId spesifik diberikan (dan bukan 'all' / 'auto')
      if (paketId && paketId !== 'all' && paketId !== 'auto') {
        const paket = await PaketMatkul.findById(paketId);
        if (!paket) throw new Error("Paket tidak ditemukan");
        
        paket.mata_kuliah.push(...mata_kuliah_list);
        await paket.save();
        
        return NextResponse.json(paket);
      }
      
      // Auto-routing cerdas berdasarkan Kategori & Konsentrasi:
      const allPakets = await PaketMatkul.find({});
      for (const mk of mata_kuliah_list) {
        const isWajib = mk.kategori === 'wajib' || (!mk.konsentrasi && !mk.kategori);
        if (isWajib) {
          // Tambahkan ke semua paket jika belum ada
          for (const p of allPakets) {
            const exists = p.mata_kuliah.some(m => m.kode.trim().toUpperCase() === mk.kode.trim().toUpperCase());
            if (!exists) {
              p.mata_kuliah.push({ ...mk, kategori: 'wajib' });
            }
          }
        } else {
          // Cari paket berdasarkan konsentrasi matkul (SDM, Keuangan, Pemasaran)
          const target = allPakets.find(p => 
            p.konsentrasi === mk.konsentrasi || 
            (mk.konsentrasi && p.nama_paket.toLowerCase().includes(mk.konsentrasi.toLowerCase()))
          );
          if (target) {
            const exists = target.mata_kuliah.some(m => m.kode.trim().toUpperCase() === mk.kode.trim().toUpperCase());
            if (!exists) {
              target.mata_kuliah.push({ ...mk, kategori: 'konsentrasi' });
            }
          }
        }
      }
      
      for (const p of allPakets) {
        await p.save();
      }
      
      return NextResponse.json({ success: true, count: allPakets.length });
    }

    if (data.action === 'save_saran') {
      const { paketId, matkulId, cpmkId, indikators } = data;
      const paket = await PaketMatkul.findById(paketId);
      if (!paket) throw new Error("Paket tidak ditemukan");
      
      const matkul = paket.mata_kuliah.id(matkulId);
      if (!matkul) throw new Error("Mata kuliah tidak ditemukan");
      
      const cpmk = matkul.cpmk.id(cpmkId);
      if (!cpmk) throw new Error("CPMK tidak ditemukan");
      
      // Append only unique new indicators
      if (Array.isArray(indikators)) {
        for (const ind of indikators) {
          const trimmed = ind.trim();
          if (trimmed && !cpmk.indikator.some(existing => existing.toLowerCase() === trimmed.toLowerCase())) {
            cpmk.indikator.push(trimmed);
          }
        }
      }
      
      paket.markModified('mata_kuliah');
      await paket.save();
      
      return NextResponse.json(paket);
    }
    
    const newPaket = await PaketMatkul.create(data);
    return NextResponse.json(newPaket, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
