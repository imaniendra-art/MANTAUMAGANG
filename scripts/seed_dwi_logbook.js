const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1];
      let val = match[2];
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not defined");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Find Dwi Astrianti
  const user = await db.collection('users').findOne({ nama_lengkap: /Dwi Astrianti/i });
  if (!user) {
    console.log("User Dwi Astrianti not found");
    process.exit(1);
  }
  console.log("Found User ID:", user._id);
  
  const pengajuan = await db.collection('pengajuanmagangs').findOne({ mahasiswa_id: user._id, status_pengajuan: 'disetujui' });
  if (!pengajuan) {
    console.log("Pengajuan disetujui not found for Dwi Astrianti");
    process.exit(1);
  }
  console.log("Found Pengajuan ID:", pengajuan._id);
  
  // Clear existing logbooks for clean state
  await db.collection('logbooks').deleteMany({ pengajuan_id: pengajuan._id });
  console.log("Cleared existing logbooks");

  // Generate 60 days of logbook entries (3 months, ~20 days/month)
  const activities = [
    { deskripsi: "Hari ini saya ditugaskan oleh mentor untuk melakukan riset keyword yang komprehensif untuk kampanye SEO bulan ini. Saya menggunakan alat seperti Ahrefs dan Google Keyword Planner untuk menemukan kata kunci dengan volume pencarian tinggi namun kompetisi rendah. Hasil riset ini kemudian saya susun ke dalam spreadsheet untuk memudahkan tim konten dalam membuat artikel blog yang relevan dan SEO-friendly.", skills: ["SEO", "Keyword Research", "Analytical Thinking"] },
    { deskripsi: "Tugas utama saya hari ini adalah merancang dan menyusun content plan mingguan untuk platform Instagram dan TikTok perusahaan. Saya mulai dengan menganalisis tren yang sedang viral di kedua platform tersebut, lalu menyesuaikannya dengan gaya komunikasi brand kami. Hasil akhirnya adalah draf jadwal unggahan selama seminggu penuh beserta ide kasar untuk setiap konten visual maupun video pendek yang akan dibuat.", skills: ["Content Planning", "Social Media Management", "Creativity"] },
    { deskripsi: "Saya menghabiskan sebagian besar waktu kerja hari ini untuk memproduksi materi desain grafis yang akan diunggah ke feed Instagram. Saya memanfaatkan Canva dan Adobe Photoshop untuk menyesuaikan template desain yang ada dengan materi promosi terbaru. Semua gambar yang dihasilkan telah disetujui oleh manajer dan langsung dijadwalkan untuk dipublikasikan pada waktu-waktu prime time agar mendapatkan engagement yang optimal.", skills: ["Graphic Design", "Canva", "Adobe Photoshop"] },
    { deskripsi: "Sesuai dengan target tim pemasaran, saya menulis sebuah artikel blog yang SEO-friendly mengenai tren digital marketing di tahun 2026. Saya memastikan penggunaan heading yang tepat, memasukkan kata kunci utama secara natural, dan menambahkan meta description yang menarik. Artikel ini diharapkan mampu meningkatkan jumlah trafik organik ke situs web utama perusahaan dalam beberapa minggu ke depan.", skills: ["Copywriting", "Content Writing", "SEO"] },
    { deskripsi: "Hari ini saya fokus untuk menganalisis performa kampanye Facebook Ads yang telah berjalan selama seminggu terakhir. Saya menemukan bahwa beberapa set iklan tidak memberikan konversi yang memuaskan sehingga saya mengambil inisiatif untuk menghentikannya dan mengalihkan sisa anggaran ke iklan yang memiliki performa terbaik. Penyesuaian budget ini telah saya laporkan ke atasan dan disetujui.", skills: ["Facebook Ads", "Data Analysis", "Performance Marketing"] },
    { deskripsi: "Pagi ini saya mengikuti rapat koordinasi bersama tim sales untuk menyelaraskan strategi promosi akhir bulan dengan target penjualan mereka. Saya mencatat berbagai masukan dari tim lapangan mengenai hambatan yang sering mereka temui saat menawarkan produk. Berdasarkan masukan tersebut, saya merumuskan beberapa ide campaign digital baru yang dapat menjembatani celah komunikasi antara produk dan calon pelanggan.", skills: ["Communication", "Teamwork", "Strategy Planning"] },
    { deskripsi: "Saya ditugaskan untuk merekam dan menyunting video pendek bergaya Reels atau TikTok yang menyoroti fitur-fitur unggulan dari produk terbaru kami. Proses editing dilakukan menggunakan CapCut dengan menambahkan musik latar yang sedang tren serta teks overlay agar lebih menarik. Video ini sudah ditinjau oleh mentor dan langsung diunggah, mendapatkan respon positif dari beberapa pengikut.", skills: ["Video Editing", "CapCut", "Content Creation"] },
    { deskripsi: "Hari ini saya bertanggung jawab untuk mengatur dan menyiapkan draf email newsletter bulanan yang akan dikirimkan kepada daftar pelanggan kami. Menggunakan platform Mailchimp, saya menata layout, memasukkan artikel blog terbaru, dan menyusun teks ajakan bertindak (CTA) yang menarik. Uji coba pengiriman juga telah dilakukan untuk memastikan tampilan email responsif di perangkat seluler.", skills: ["Email Marketing", "Mailchimp", "Copywriting"] },
    { deskripsi: "Sebagian besar waktu kerja hari ini saya dedikasikan untuk mengoptimalkan elemen on-page SEO pada halaman pendaratan (landing page) produk baru perusahaan. Saya memperbaiki struktur tag HTML, mengoptimalkan ukuran gambar agar waktu muat situs menjadi lebih cepat, dan memastikan relevansi konten dengan target audiens. Semua perubahan ini sudah didokumentasikan dalam laporan harian.", skills: ["SEO", "On-page Optimization", "Web Management"] },
    { deskripsi: "Hari ini saya bertugas sebagai perwakilan brand untuk mengelola interaksi dengan audiens di media sosial, khususnya membalas pesan langsung (DM) dan komentar di Instagram. Saya menjawab berbagai pertanyaan terkait spesifikasi produk dan membantu mengarahkan calon pembeli ke tautan pembelian yang benar. Aktivitas ini sangat membantu dalam meningkatkan kepercayaan pelanggan terhadap responsivitas perusahaan.", skills: ["Customer Engagement", "Community Management", "Communication"] },
    { deskripsi: "Di akhir bulan ini, tugas saya adalah mengompilasi dan menyusun laporan bulanan terkait performa seluruh saluran media sosial perusahaan. Saya mengumpulkan metrik seperti Engagement Rate, Total Reach, dan jumlah pengikut baru dari berbagai platform. Laporan ini kemudian saya sajikan dalam bentuk presentasi singkat yang akan dibahas dalam evaluasi tim pemasaran besok pagi.", skills: ["Reporting", "Data Analysis", "Social Media Management"] },
    { deskripsi: "Saya melaksanakan inisiatif A/B testing untuk beberapa variasi ad copy dan banner visual pada kampanye Google Ads yang sedang berjalan. Tujuannya adalah untuk mengidentifikasi kombinasi mana yang menghasilkan Click-Through Rate (CTR) tertinggi dengan biaya per klik termurah. Hasil awal menunjukkan bahwa variasi teks yang lebih singkat memberikan performa yang jauh lebih baik.", skills: ["Google Ads", "A/B Testing", "Analytical Thinking"] },
    { deskripsi: "Hari ini saya ditugaskan untuk mencari dan menghubungi beberapa Key Opinion Leaders (KOL) atau influencer yang relevan dengan niche industri kita. Saya mengirimkan pesan penawaran kerja sama (endorsement) dan mendiskusikan tarif serta syarat-syarat teknis pemuatan konten. Beberapa influencer sudah memberikan respon positif dan setuju untuk melanjutkan ke tahap pengiriman sampel produk.", skills: ["Influencer Marketing", "Negotiation", "Public Relations"] },
    { deskripsi: "Saya mengelola kalender editorial konten perusahaan dan memastikan semua materi publikasi sudah terjadwal dengan rapi menggunakan aplikasi Hootsuite. Saya memasukkan semua konten visual beserta caption yang telah disetujui sebelumnya ke dalam sistem, mengatur tanggal dan jam tayang agar sesuai dengan waktu aktif audiens kita di masing-masing platform media sosial.", skills: ["Time Management", "Social Media Management", "Hootsuite"] },
    { deskripsi: "Tugas saya hari ini adalah melakukan riset kompetitor secara mendalam untuk mempelajari strategi promosi dan kampanye digital yang sedang mereka jalankan. Saya menganalisis jenis konten yang mereka hasilkan, frekuensi unggahan, serta interaksi audiens mereka. Hasil pengamatan ini saya catat sebagai rekomendasi strategis bagi tim kita agar dapat lebih bersaing di pasar.", skills: ["Competitor Analysis", "Market Research", "Critical Thinking"] }
  ];

  const startDate = new Date('2026-04-01T08:00:00');
  
  let currentDate = new Date(startDate);
  const logbooksToInsert = [];
  
  for (let i = 0; i < 65; i++) { // ~3 months working days
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    // Add some variance to time
    const startHour = 8;
    const endHour = 16 + Math.floor(Math.random() * 2); // 16:00 or 17:00
    
    const jam_mulai = new Date(currentDate);
    jam_mulai.setHours(startHour, 0, 0, 0);
    
    const jam_selesai = new Date(currentDate);
    jam_selesai.setHours(endHour, 0, 0, 0);

    const logbook = {
      pengajuan_id: pengajuan._id,
      mahasiswa_id: user._id,
      tanggal: new Date(currentDate),
      deskripsi_kegiatan: activity.deskripsi,
      dokumentasi: [{
        file: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop",
        keterangan: "Foto Kegiatan"
      }],
      status_validasi: "menunggu_mentor",
      extracted_skills: activity.skills, // Populating skills straight away for demo purposes
      nilai_otomatis: Math.floor(Math.random() * 11) + 80, // 80 - 90
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    logbooksToInsert.push(logbook);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  await db.collection('logbooks').insertMany(logbooksToInsert);
  console.log(`Inserted ${logbooksToInsert.length} logbook entries for Dwi Astrianti.`);

  process.exit(0);
}

run().catch(console.error);
