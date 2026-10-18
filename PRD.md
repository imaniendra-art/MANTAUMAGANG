# Product Requirements Document (PRD)

**Project**: MANTAUMAGANG (Manajemen Aktivitas, Penilaian, & Tata Administrasi Umum Magang Berdampak)  
**Institusi**: STIMI YAPMI Makassar  
**Version**: 1.0.0-rc1  
**Status**: Approved (Ready for Implementation)  
**Created**: 2026-10-18  
**Last Updated**: 2026-10-18  

---

## 1. Executive Summary

MANTAUMAGANG adalah platform digital terintegrasi untuk mendokumentasikan, memantau, dan mengonversi seluruh aktivitas program Magang Berdampak mahasiswa STIMI YAPMI Makassar ke dalam Satuan Kredit Semester (SKS). Sistem ini menghubungkan Admin Program Studi, Mahasiswa, Dosen Pembimbing Lapangan (DPL), dan Mentor Instansi Mitra secara *seamless*. Dengan memanfaatkan kecerdasan buatan (Gemini 1.5 Flash), sistem secara objektif memetakan kegiatan harian mahasiswa terhadap indikator Capaian Pembelajaran Mata Kuliah (CPMK) untuk menghasilkan skor konversi mata kuliah secara otomatis dan transparan.

---

## 2. Problem Statement

* **Kendala Administrasi Manual**: Proses pemantauan magang dan pelaporan harian mahasiswa sebelumnya tersebar dan tidak terstandarisasi, menyulitkan rekapitulasi kehadiran dan bukti kinerja riil.
* **Kompleksitas Konversi SKS (OBE)**: DPL sering mengalami beban kognitif berlebih ketika harus mengonversi deskripsi kegiatan lapangan menjadi nilai numerik mata kuliah konversi 20 SKS secara manual dan subjektif.
* **Risiko Integritas Data**: Dokumentasi kegiatan magang rawan manipulasi jika tidak dikunci secara berjenjang melalui serah terima resmi dan validasi berjenjang (Mentor lapangan lalu DPL).
* **Kendala Teknis Codebase Awal**: Terdapat celah penentuan paket mata kuliah konversi yang masih acak (`findOne()`), penyimpanan foto Base64 di MongoDB yang berisiko merusak database (*16MB limit*), dan kebocoran serah terima DPL pada form logbook.

---

## 3. Goals & Success Metrics

| Sasaran (Goal) | Indikator Metrik | Target Kinerja |
|---|---|---|
| **Otomasi Konversi Nilai SKS** | Akurasi kalkulasi formula (70% AI CPMK + 18% DPL + 12% Mentor) | 100% transkrip terhitung otomatis |
| **Integritas Alur Serah Terima** | Persentase logbook yang diisi sebelum serah terima DPL | 0% (tergembok mutlak sampai `is_dpl_confirmed = true`) |
| **Kesesuaian Kurikulum CPMK** | Keselarasan paket matkul dengan prodi/konsentrasi mahasiswa | 100% tepat sesuai konsentrasi |
| **Stabilitas Database & Storage** | Insiden *BSON document size limit* (16MB) di MongoDB | 0 insiden (100% foto tersimpan di disk lokal) |
| **Kemudahan Mentor Lapangan** | Akses penilaian mentor via *Magic Link* tanpa login rumit | Response rate evaluasi mentor > 90% |

---

## 4. User Personas

### 1. Admin Program Studi
* **Peran**: Pengelola kurikulum, master data, dan otoritas akademik.
* **Tanggung Jawab**: Mengimpor seluruh akun mahasiswa via Excel, mengelola daftar instansi mitra & posisi magang, memvalidasi berkas pendaftaran, serta menugaskan DPL.

### 2. Mahasiswa Magang
* **Peran**: Peserta program Magang Berdampak.
* **Tanggung Jawab**: Login menggunakan NIM, memilih posisi di Bursa Magang, melakukan absensi harian dan mengisi logbook (deskripsi kegiatan STAR + foto bukti) setiap hari kerja setelah serah terima.

### 3. Dosen Pembimbing Lapangan (DPL)
* **Peran**: Pembimbing akademik dan penghubung kampus dengan dunia usaha/industri.
* **Tanggung Jawab**: Menugaskan mentor instansi, mengonfirmasi serah terima mahasiswa ke mitra, memantau ketercapaian CPMK, serta memberikan penilaian bimbingan/laporan akademik (bobot 18%).

### 4. Mentor Lapangan (Instansi Mitra)
* **Peran**: Pembimbing teknis dan supervisor harian mahasiswa di tempat magang.
* **Tanggung Jawab**: Menyetujui/merevisi logbook harian mahasiswa dan memberikan penilaian kedisiplinan/kinerja lapangan via *Magic Link* (bobot 12%).

---

## 5. Feature Requirements & Scope

### In-Scope (Fase Uji Coba Perdana - v1.0)
- [x] **Pendaftaran Pengguna Terpusat**: Pengelolaan akun oleh Admin Prodi (Impor Excel & Input Form). Mahasiswa login dengan NIM.
- [ ] **Pemetaan Paket Matkul Presisi**: Pengajuan magang mahasiswa otomatis mengikat `paket_matkul_id` yang sesuai dengan konsentrasi mahasiswa (SDM, Keuangan, Pemasaran, dsb.), dapat ditinjau ulang oleh Admin saat validasi.
- [ ] **Gembok Serah Terima Logbook**: Akses pengisian logbook mahasiswa terkunci sampai DPL menyelesaikan serah terima ke mentor (`is_dpl_confirmed = true`).
- [ ] **Penyimpanan Berkas Fisik Mandiri**: Refaktor penanganan foto logbook dari string Base64 MongoDB ke sistem berkas lokal publik (`/public/uploads/logbook/`).
- [x] **Pemetaan Semantik AI Berbasis CPMK**: Gemini 1.5 Flash mencocokkan kegiatan mahasiswa dengan indikator CPMK dan mengekstrak skills.
- [x] **Formula Konversi 70-18-12**:
  $$\text{Nilai Akhir} = (\text{Base Score CPMK} \times 0.70) + (\text{Rata-rata Nilai DPL} \times 0.18) + (\text{Rata-rata Nilai Mentor} \times 0.12)$$
- [x] **Transkrip Digital & QR Verification**: Pembuatan transkrip final konversi SKS dengan QR Code verifikasi keaslian dokumen.
- [ ] **Proteksi Route API**: Pengamanan endpoint backend dari akses tanpa izin menggunakan NextAuth server-side session guard.

### Out-of-Scope (Fase Lanjutan - v2.0)
- Registrasi mandiri mahasiswa via form publik luar kampus (diputuskan terpusat via Admin).
- Integrasi Cloudflare R2 / AWS S3 terdistribusi (menggunakan penyimpanan server lokal untuk tahap uji coba).
- Sistem absensi berbasis radius geolokasi GPS presisi tinggi.

---

## 6. Technical Architecture & Decisions (ADRs)

### Tech Stack
* **Framework**: Next.js 16 (App Router) + React 19
* **Styling**: Tailwind CSS v4 + Lucide Icons
* **Database**: MongoDB dengan Mongoose ODM
* **Authentication**: NextAuth.js v4 (JWT Strategy)
* **AI Engine**: `@google/generative-ai` (Gemini 1.5 Flash via REST/SDK)
* **Dokumen & PDF**: jsPDF + HTML2Canvas + QR Code

### Architectural Decision Records (ADRs)
* **ADR-001 (CPMK-Centric Matching)**: Evaluasi AI difokuskan langsung pada indikator operasional CPMK daripada payung filosofis CPL untuk menghasilkan penilaian konkret berbasis capaian tugas harian.
* **ADR-002 (Formula Proporsional 70-18-12)**: Menghilangkan keharusan DPL menilai mata kuliah konversi satu per satu; DPL hanya menilai aspek laporan/bimbingan (18%), Mentor menilai kedisiplinan/soft-skill (12%), dan 70% dihitung objektif dari logbook tervalidasi.
* **ADR-003 (Self-Contained Local File Storage)**: Menghentikan penyimpanan Base64 di MongoDB untuk menghindari limit 16MB; foto disimpan ke direktori `public/uploads/logbook/` dengan nama timestamp-hash unik.
* **ADR-004 (Centralized Admin Onboarding)**: Mahasiswa tidak mendaftar mandiri via publik guna memastikan hanya mahasiswa aktif yang terdata di PDDikti/kampus yang dapat mengakses bursa magang.

---

## 7. Data Flow & State Machine

```
[Admin Import Mahasiswa] ──> [Mahasiswa Pilih Posisi di Bursa] ──> [Pengajuan: 'menunggu']
                                                                            │
                                                                   [Admin Validasi & Pilih DPL]
                                                                            │
                                                                   [Pengajuan: 'disetujui']
                                                                   (Logbook masih terkunci!)
                                                                            │
                                                               [DPL Tugaskan Mentor & Serah Terima]
                                                                (is_dpl_confirmed = true)
                                                                            │
                                                                ┌───────────┴───────────┐
                                                                ▼                       ▼
                                                     [Mahasiswa Isi Logbook]    [Check-in Absensi]
                                                                │
                                                    [AI Gemini Matching CPMK]
                                                                │
                                                    [Mentor Validasi Logbook]
                                                                │
                                                     (Akumulasi Base Score)
                                                                │
                                      ┌─────────────────────────┴────────────────────────┐
                                      ▼                                                  ▼
                        [Mentor Isi Nilai Lapangan (12%)]                   [DPL Isi Nilai Bimbingan (18%)]
                                      │                                                  │
                                      └─────────────────────────┬────────────────────────┘
                                                                ▼
                                                [Kunci Transkrip & Cetak Nilai SKS]
```

---

## 8. Non-Functional Requirements (NFR)

* **Performance**: Waktu muat halaman dashboard < 1.5 detik pada koneksi standar.
* **Reliability**: Panggilan AI Gemini memiliki mekanisme *fallback* sehingga kegagalan sementara jaringan tidak menghilangkan draf teks kegiatan logbook mahasiswa.
* **Storage Economy**: Ukuran foto logbook dibatasi maksimal 2MB per foto (maksimal 3 foto per logbook harian) dengan format JPEG/PNG/WebP.
* **Data Security**: Password tersimpan dengan *bcrypt hash*, endpoint API diamankan dengan pengecekan peran (Role-Based Access Control).

---

## 9. Verification & Delivery Gate

Sistem dinyatakan lulus uji coba dan siap rilis jika:
1. Mahasiswa tidak dapat mengirimkan logbook jika DPL belum melakukan serah terima (`is_dpl_confirmed = false`).
2. Logbook tersimpan dengan URL file fisik dan tidak ada string Base64 yang masuk ke MongoDB.
3. Paket matakuliah terikat tepat ke konsentrasi mahasiswa.
4. AI Gemini berhasil mencocokkan minimal 1–3 indikator CPMK pada logbook yang relevan.
5. Nilai akhir pada transkrip terhitung akurat sesuai formula 70% + 18% + 12%.
