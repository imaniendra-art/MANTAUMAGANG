const { default: mongoose } = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const student = await db.collection('users').findOne({ nama_lengkap: /Dwi Astrianti/i });
  const pengajuan = await db.collection('pengajuanmagangs').findOne({ mahasiswa_id: student._id, status_pengajuan: 'disetujui' });

  const bab1 = [
    { id: '1_1', title: '1.1 Latar Belakang', content: 'Kegiatan magang ini dilaksanakan sebagai bentuk penerapan ilmu pengetahuan yang telah didapatkan di bangku perkuliahan ke dalam dunia kerja yang sesungguhnya. Dalam era globalisasi saat ini, mahasiswa dituntut tidak hanya memiliki kecerdasan akademik, tetapi juga keterampilan praktis yang dapat menunjang kinerja mereka di lapangan. Oleh karena itu, program magang ini menjadi sarana yang sangat tepat untuk menjembatani teori dan praktik.' },
    { id: '1_2', title: '1.2 Tujuan Magang', content: 'Tujuan utama dari kegiatan magang ini adalah untuk mendapatkan pengalaman kerja secara nyata di industri, mengasah soft skill maupun hard skill, serta memperluas jaringan profesional. Selain itu, magang ini bertujuan untuk memenuhi salah satu syarat kelulusan mata kuliah kerja praktik yang ditetapkan oleh program studi.' },
    { id: '1_3', title: '1.3 Manfaat Magang', content: 'Bagi mahasiswa, magang ini memberikan wawasan baru terkait dinamika dunia kerja, meningkatkan rasa percaya diri, serta melatih kedisiplinan dan tanggung jawab. Bagi perusahaan, kegiatan ini dapat menjadi ajang transfer pengetahuan serta membantu meringankan tugas-tugas operasional. Bagi kampus, magang ini diharapkan dapat mempererat hubungan kerjasama dengan industri.' }
  ];

  const bab2 = [
    { id: '2_1', title: '2.1 Deskripsi & Sejarah Perusahaan', content: 'Perusahaan tempat magang berlangsung adalah sebuah entitas bisnis yang bergerak di bidang teknologi informasi dan komunikasi. Berdiri sejak sepuluh tahun yang lalu, perusahaan ini telah bertransformasi menjadi salah satu penyedia layanan digital terkemuka di tingkat nasional dengan berbagai portofolio proyek bergengsi.' },
    { id: '2_2', title: '2.2 Visi dan Misi', content: 'Visi perusahaan adalah menjadi pelopor inovasi teknologi digital yang berkelanjutan. Misi perusahaan meliputi penyediaan solusi IT yang terjangkau, pengembangan sumber daya manusia yang kompeten, serta penciptaan ekosistem digital yang inklusif bagi seluruh lapisan masyarakat.' },
    { id: '2_3', title: '2.3 Struktur Organisasi', content: 'Struktur organisasi perusahaan ini menganut sistem hierarki yang dinamis. Terdapat jajaran direksi yang membawahi berbagai divisi utama seperti divisi pengembangan produk, divisi pemasaran, divisi sumber daya manusia, serta divisi operasional dan dukungan pelanggan.' },
    { id: '2_4', title: '2.4 Strategi Bisnis', content: 'Strategi bisnis yang diterapkan berfokus pada pendekatan customer-centric, di mana seluruh pengembangan produk selalu didasarkan pada kebutuhan dan umpan balik dari pengguna. Selain itu, perusahaan juga aktif melakukan kolaborasi strategis dengan berbagai mitra bisnis.' },
    { id: '2_5', title: '2.5 Aspek Manajemen', content: 'Manajemen perusahaan menerapkan prinsip tata kelola perusahaan yang baik (Good Corporate Governance). Setiap proses pengambilan keputusan dilakukan melalui mekanisme rapat rutin yang melibatkan seluruh pemangku kepentingan terkait di dalam perusahaan.' },
    { id: '2_6', title: '2.6 Aspek Produksi / Operasional', content: 'Aspek operasional perusahaan didukung oleh infrastruktur teknologi yang mutakhir. Standar operasional prosedur (SOP) dijalankan secara ketat untuk menjamin kualitas layanan dan meminimalisir terjadinya gangguan pada sistem yang berjalan.' },
    { id: '2_7', title: '2.7 Aspek Keuangan', content: 'Perusahaan memiliki tata kelola keuangan yang transparan dan akuntabel. Pendapatan utama bersumber dari layanan berlangganan perangkat lunak (SaaS) serta proyek pengembangan sistem informasi skala besar.' },
    { id: '2_8', title: '2.8 Aspek Pemasaran', content: 'Pemasaran dilakukan melalui kombinasi strategi digital marketing, penyelenggaraan webinar, serta partisipasi aktif dalam pameran teknologi tingkat nasional dan internasional.' },
    { id: '2_9', title: '2.9 Aspek Sumber Daya Manusia', content: 'Karyawan merupakan aset terbesar perusahaan. Oleh karena itu, perusahaan rutin menyelenggarakan program pelatihan dan pengembangan kapasitas guna memastikan seluruh karyawan terus memperbarui keterampilan mereka sesuai dengan perkembangan zaman.' },
    { id: '2_10', title: '2.10 Lingkup Unit Kerja & Lokasi Kantor', content: 'Kantor pusat perusahaan berlokasi di kawasan bisnis strategis di ibu kota. Lingkup unit kerja penulis sendiri berada di bawah naungan Divisi Pengembangan Produk, khususnya di tim pengembangan perangkat lunak.' }
  ];

  const bab3 = [
    { id: '3_1', title: '3.1 Lingkup Penugasan', content: 'Selama masa magang, penulis ditugaskan untuk terlibat langsung dalam proyek pengembangan fitur baru pada sistem internal perusahaan. Tugas ini mencakup analisis kebutuhan pengguna, perancangan antarmuka, hingga implementasi kode sumber di lingkungan uji coba.' },
    { id: '3_2', title: '3.2 Rencana dan Penjadwalan Kerja', content: 'Rencana kerja disusun setiap hari Senin pagi melalui rapat koordinasi mingguan (Sprint Planning). Penulis diberikan target mingguan yang harus diselesaikan dan dilaporkan progresnya secara berkala kepada mentor lapangan.' },
    { id: '3_3', title: '3.3 Deskripsi Aktivitas Kegiatan Magang', content: 'Aktivitas harian meliputi penulisan kode, peninjauan kode bersama rekan tim, serta melakukan pengujian fungsionalitas sistem. Selain itu, penulis juga rutin mengikuti sesi diskusi santai untuk berbagi pengetahuan teknis terbaru dengan seluruh anggota tim.' }
  ];

  const bab4 = [
    { id: '4_1', title: '4.1 Latar Belakang Permasalahan', content: 'Dalam pelaksanaan tugas, penulis seringkali dihadapkan pada kendala teknis terkait integrasi antarmuka pemrograman aplikasi (API) dari pihak ketiga yang sering mengalami perubahan tanpa pemberitahuan sebelumnya.' },
    { id: '4_2', title: '4.2 Dampak Masalah terhadap Penulis dan Tim', content: 'Permasalahan ini menyebabkan tertundanya penyelesaian beberapa fitur krusial, yang pada akhirnya memengaruhi jadwal rilis produk. Tim harus mengalokasikan waktu ekstra untuk melakukan investigasi dan penyesuaian kode.' },
    { id: '4_3', title: '4.3 Solusi yang Dilakukan', content: 'Sebagai solusi, penulis mengusulkan pembuatan mekanisme penanganan kesalahan (error handling) yang lebih tangguh serta membangun sebuah layanan penghubung (middleware) yang dapat mendeteksi perubahan API secara otomatis. Usulan ini kemudian disetujui dan diimplementasikan oleh tim.' }
  ];

  const bab5 = [
    { id: '5_1', title: '5.1 Kesimpulan', content: 'Berdasarkan uraian di atas, dapat disimpulkan bahwa kegiatan magang ini telah memberikan dampak yang sangat positif bagi pengembangan kompetensi penulis. Penulis tidak hanya mendapatkan ilmu teknis, tetapi juga belajar banyak mengenai etos kerja, kerja sama tim, dan pemecahan masalah.' },
    { id: '5_2', title: '5.2 Saran & Rekomendasi untuk Perusahaan', content: 'Saran untuk perusahaan adalah agar dapat terus mempertahankan budaya kerja yang suportif dan inovatif. Selain itu, dokumentasi teknis internal diharapkan dapat diperbarui secara lebih berkala agar memudahkan proses adaptasi bagi peserta magang baru di masa mendatang.' },
    { id: '5_3', title: '5.3 Saran & Rekomendasi untuk Kampus / Calon Peserta', content: 'Bagi pihak kampus, disarankan untuk memperbanyak mata kuliah yang berorientasi pada proyek nyata (Project-Based Learning) agar mahasiswa lebih siap menghadapi dunia kerja. Bagi calon peserta magang, persiapkan diri dengan baik dan jangan ragu untuk proaktif bertanya kepada mentor.' }
  ];

  const bab6 = [
    { id: '6_1', title: '6.1 Hal-hal Positif dan Manfaat yang Diterima', content: 'Hal positif yang sangat terasa adalah meningkatnya kemampuan penulis dalam mengelola waktu dan bekerja di bawah tekanan. Penulis juga merasa sangat terbantu dengan adanya bimbingan yang intensif dari mentor lapangan yang selalu bersedia meluangkan waktu.' },
    { id: '6_2', title: '6.2 Hal-hal yang Menyadarkan terhadap Kekurangan Diri', content: 'Kegiatan magang ini juga menyadarkan penulis bahwa masih banyak kekurangan dalam hal penguasaan teknologi-teknologi terbaru serta keterampilan komunikasi profesional. Hal ini menjadi motivasi bagi penulis untuk terus belajar dan memperbaiki diri setelah masa magang berakhir.' }
  ];

  const newLaporan = {
    pengajuan_id: pengajuan._id,
    mahasiswa_id: student._id,
    bab1_pendahuluan: JSON.stringify(bab1),
    bab2_profil: JSON.stringify(bab2),
    bab3_aktivitas: JSON.stringify(bab3),
    bab4_permasalahan: JSON.stringify(bab4),
    bab5_kesimpulan: JSON.stringify(bab5),
    bab6_refleksi: JSON.stringify(bab6),
    file_pengantar: 'https://example.com/pengantar.pdf',
    file_penerimaan: 'https://example.com/penerimaan.pdf',
    file_keterangan: 'https://example.com/keterangan.pdf',
    file_struktur_organisasi: 'https://example.com/struktur.pdf',
    status: 'submitted',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Upsert the LaporanAkhir
  await db.collection('laporanakhirs').updateOne(
    { pengajuan_id: pengajuan._id },
    { $set: newLaporan },
    { upsert: true }
  );

  console.log("Laporan Akhir berhasil diisi!");
  process.exit(0);
}

run().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
