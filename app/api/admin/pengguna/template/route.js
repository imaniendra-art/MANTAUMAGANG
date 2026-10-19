import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  if (format === 'csv') {
    const csvContent = "no;nim;nama;prodi\n1;246120100;Muhammad Budi;Manajemen (S1)\n2;246120101;Siti Aminah;Manajemen (S1)\n3;246120102;Ahmad Fauzi;Manajemen (S1)";
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Template_Import_SIAM.csv"'
      }
    });
  }

  // Default Excel (.xlsx)
  const templateRows = [
    { No: 1, NIM: "246120100", "Nama Mahasiswa": "Muhammad Budi", "Program Studi": "Manajemen (S1)" },
    { No: 2, NIM: "246120101", "Nama Mahasiswa": "Siti Aminah", "Program Studi": "Manajemen (S1)" },
    { No: 3, NIM: "246120102", "Nama Mahasiswa": "Ahmad Fauzi", "Program Studi": "Manajemen (S1)" },
  ];
  const ws = XLSX.utils.json_to_sheet(templateRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mahasiswa");
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Template_Import_Mahasiswa.xlsx"'
    }
  });
}

