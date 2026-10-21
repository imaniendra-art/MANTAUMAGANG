import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    const cleanRelativePath = pathSegments.join('/');

    // Mencegah directory traversal
    const normalized = path.normalize(cleanRelativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', normalized);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!absolutePath.startsWith(uploadsDir)) {
      return new NextResponse('Akses ditolak', { status: 403 });
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
    else if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (err) {
    console.error('Error serving upload file:', err);
    return new NextResponse('Terjadi kesalahan membaca file', { status: 500 });
  }
}
