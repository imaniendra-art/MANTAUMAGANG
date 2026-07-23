import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import AppConfig from '@/models/AppConfig';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    await connectToDatabase();
    let config = await AppConfig.findOne({ singleton_id: 'GLOBAL_CONFIG' });
    
    if (!config) {
      config = await AppConfig.create({});
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'admin_prodi')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const formData = await request.formData();
    const nama_institusi = formData.get('nama_institusi');
    const nama_pejabat_pengesah = formData.get('nama_pejabat_pengesah');
    const nama_ketua_institusi = formData.get('nama_ketua_institusi');
    const nidn_pejabat = formData.get('nidn_pejabat');
    const jabatan_pejabat = formData.get('jabatan_pejabat');
    
    const logoFile = formData.get('logo_url');
    
    // Process files if provided
    let logoPath = formData.get('current_logo') || null;
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (logoFile && typeof logoFile !== 'string') {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const fileName = `logo_${Date.now()}_${logoFile.name.replace(/\s+/g, '_')}`;
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      logoPath = `/uploads/${fileName}`;
    }

    const updateData = {
      nama_institusi,
      nama_pejabat_pengesah,
      nama_ketua_institusi,
      nidn_pejabat,
      jabatan_pejabat,
      logo_url: logoPath
    };

    let config = await AppConfig.findOne({ singleton_id: 'GLOBAL_CONFIG' });
    
    if (config) {
      config = await AppConfig.findOneAndUpdate(
        { singleton_id: 'GLOBAL_CONFIG' },
        updateData,
        { new: true }
      );
    } else {
      config = await AppConfig.create(updateData);
    }

    return NextResponse.json({ message: 'Configuration saved successfully', data: config });
  } catch (error) {
    console.error('Error saving config:', error);
    try {
      fs.writeFileSync('/tmp/mantau-error.log', error.stack || error.toString());
    } catch(e) {}
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
