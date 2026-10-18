# MANTAUMAGANG — Design & Skill Orchestration Document (BLUEPRINT)

**Proyek**: MANTAUMAGANG — STIMI YAPMI Makassar  
**Arsitektur Target**: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + MongoDB Mongoose  
**Status**: Approved Architecture (Siap Eksekusi)  
**Versi**: 1.0.0-rc1  

---

## 1. Ringkasan Pemahaman Arsitektur

Platform **MANTAUMAGANG** dibangun untuk mengelola siklus hidup penuh program Magang Berdampak:
1. **Onboarding**: Terpusat via Admin Prodi (Impor Excel / Tambah Manual). Mahasiswa login menggunakan NIM.
2. **Bursa & Pengajuan**: Mahasiswa memilih posisi magang mitra sesuai konsentrasi (`SDM`, `Keuangan`, `Pemasaran`, `Pengembangan Bisnis`).
3. **Validasi & Penetapan**: Admin memvalidasi berkas dan menugaskan DPL dengan paket mata kuliah konversi yang tepat.
4. **Serah Terima**: DPL menugaskan Mentor dan melakukan konfirmasi serah terima (`is_dpl_confirmed = true`).
5. **Aktivitas Magang**: Mahasiswa mengisi absensi dan logbook harian (metode STAR + foto fisik).
6. **AI Semantics**: Gemini 1.5 Flash memetakan kegiatan mahasiswa ke indikator CPMK untuk menghitung Base Score 70%.
7. **Penilaian Terintegrasi**: Mentor menilai via Link Ajaib (12%), DPL menilai laporan/bimbingan (18%), dan sistem otomatis mencetak Transkrip Nilai SKS final.

---

## 2. Rencana Perbaikan Teknis & Delegasi Skill

```
┌─────────────────────────────────┬────────────────────────────────────────┬──────────────────────────────────────────┐
│ Modul / Area Kerja              │ Solusi Desain Teknis                   │ Skill Spesialis yang Mengawal            │
├─────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
│ 1. Storage Foto Logbook         │ Simpan berkas fisik ke disk lokal      │ `fullstack-craftsman`                    │
│    (Eliminasi Base64 MongoDB)   │ `public/uploads/logbook/` dengan UUID. │ `js-backend-expert`                      │
│                                 │ Di MongoDB hanya simpan URL path.      │                                          │
├─────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
│ 2. Pemetaan Paket Matkul        │ Query paket matkul berdasarkan         │ `fullstack-craftsman`                    │
│    (Eliminasi findOne() acak)   │ konsentrasi mahasiswa + skema instansi.│ `database-orm-expert`                    │
│                                 │ Berikan dropdown override di Admin.    │                                          │
├─────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
│ 3. Gembok Serah Terima DPL      │ Pasang proteksi berlapis:              │ `senior-frontend`                        │
│    (Frontend & Backend Guard)   │ - UI: Tampilkan gembok jika belum      │ `fullstack-craftsman`                    │
│                                 │   `is_dpl_confirmed`.                  │                                          │
│                                 │ - API: Tolak `POST /api/logbook` jika  │                                          │
│                                 │   belum diserahterimakan.              │                                          │
├─────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
│ 4. AI Gemini Matching & Scoring │ Pastikan eksekusi AI di-await dan      │ `ai-llm-integration-expert`              │
│    (CPMK 70% Base Score)        │ memiliki fallback error handling       │ `gemini-agent-booster`                   │
│                                 │ agar tidak terputus di runtime server. │                                          │
├─────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
│ 5. Proteksi Keamanan API        │ Tambahkan session guard NextAuth       │ `quality-guardian`                       │
│    (Role-Based Access Control)  │ di `/api/admin/*`, `/api/dpl/*`.       │ `authentication-identity-expert`         │
└─────────────────────────────────┴────────────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 3. Komponen & Detail Alur Data

### A. Alur Unggah Berkas Fisik Foto Logbook
```
[Mahasiswa Unggah Foto (Maks 2MB)]
                │
                ▼
[Client: Kirim FormData / Base64 Payload]
                │
                ▼
[API: POST /api/logbook]
                │
                ├──> Simpan Buffer ke `public/uploads/logbook/${timestamp}-${uuid}.webp`
                │
                ├──> Ganti path objek foto menjadi: `/uploads/logbook/${timestamp}-${uuid}.webp`
                │
                └──> Simpan ke MongoDB Logbook document (< 5 KB, Super Ringan)
```

### B. Alur Penentuan Paket Matkul Konversi
```
[Mahasiswa Klik 'Daftar Posisi' di Bursa]
                │
                ▼
[API: POST /api/mahasiswa/pengajuan]
                │
                ├──> Ambil Konsentrasi Mahasiswa (User.konsentrasi)
                │
                ├──> Cari Paket Matkul yang cocok (atau jenis_skema: 'instansi')
                │
                └──> Kaitkan `paket_matkul_id` valid ke dokumen PengajuanMagang
```

### C. Alur Gembok Serah Terima DPL
```
[Mahasiswa Buka /mahasiswa/logbook]
                │
                ├──> Cek `pengajuan.status_pengajuan === 'disetujui'`
                │
                └──> Cek `pengajuan.is_dpl_confirmed === true`
                         │
                         ├──> [TIDAK] ──> Tampilkan status "Menunggu Serah Terima DPL & Mentor"
                         │
                         └──> [YA]    ──> Form Logbook Terbuka & Mahasiswa Dapat Mengisi
```

---

## 4. Log Keputusan Arsitektur (Decision Log)

| # | Keputusan | Alternatif Dipertimbangkan | Rasional & Standar Modern |
|---|-----------|---------------------------|---------------------------|
| 1 | **Fokus Evaluasi ke CPMK** | Menghubungkan CPL + CPMK | CPMK memiliki indikator langsung yang merefleksikan aksi harian di dunia industri; CPL bersifat makro. |
| 2 | **Formula 70-18-12 Tetap** | DPL menilai seluruh matkul manual | Formula 70-18-12 menghemat waktu DPL tanpa mengurangi objektivitas evaluasi lapangan. |
| 3 | **Penyimpanan Berkas Disk Lokal** | Cloudflare R2 / AWS S3 / MinIO | Untuk fase perdana/uji coba, penyimpanan disk lokal jauh lebih minim hambatan konfigurasi kredensial dan tanpa biaya ekstra. |
| 4 | **Pendaftaran Terpusat Admin** | Registrasi Mandiri Publik | Menjaga basis data steril dari pendaftar non-mahasiswa atau akun ganda. |

---

## 5. Rencana Aksi Eksekusi Bertahap (Handoff Pipeline)

1. **Tahap 1: Pembetulan Skema Storage & Perbaikan Upload Logbook**
   * Buat direktori `public/uploads/logbook` jika belum ada.
   * Perbarui handler `POST /api/logbook` dan `PATCH /api/logbook` untuk menulis foto langsung ke disk fisik, bukan Base64 ke database.
2. **Tahap 2: Pembetulan Penetapan Paket Matkul Konversi**
   * Perbarui `app/api/mahasiswa/pengajuan/route.js` agar memetakan `paket_matkul_id` yang sesuai konsentrasi/skema mahasiswa.
   * Pastikan validasi admin menampilkan paket matkul yang dipilih.
3. **Tahap 3: Pengetatan Gembok Serah Terima DPL**
   * Perbarui `app/mahasiswa/logbook/page.js` agar secara eksplisit mengecek `is_dpl_confirmed`.
   * Perbarui `app/api/logbook/route.js` untuk menolak insert logbook jika `is_dpl_confirmed !== true`.
4. **Tahap 4: Stabilisasi AI Matching & Nilai 70%**
   * Pastikan pemanggilan AI Gemini pada logbook tertangani secara terstruktur dengan penanganan error yang andal.
5. **Tahap 5: Audit & Pengujian Menyeluruh**
   * Uji alur lengkap dari pendaftaran bursa -> validasi admin -> serah terima DPL -> pengisian logbook -> penilaian mentor -> pleno DPL -> cetak transkrip.
