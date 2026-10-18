import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return new NextResponse('File path is required', { status: 400 });
    }

    // Jika berupa external URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return NextResponse.redirect(filePath);
    }

    // Sanitize path mencegah directory traversal
    const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const cleanPath = normalized.replace(/^\/+/, '');
    const absolutePath = path.join(process.cwd(), 'public', cleanPath);

    // Pastikan path berada dalam folder public
    const publicDir = path.join(process.cwd(), 'public');
    if (!absolutePath.startsWith(publicDir)) {
      return new NextResponse('Akses file ditolak', { status: 403 });
    }

    if (!fs.existsSync(absolutePath)) {
      return new NextResponse('File tidak ditemukan di server', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
    });
  } catch (err) {
    console.error('Error viewing file:', err);
    return new NextResponse('Terjadi kesalahan membaca file', { status: 500 });
  }
}
