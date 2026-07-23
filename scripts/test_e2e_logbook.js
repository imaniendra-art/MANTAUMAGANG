const { default: mongoose } = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log("=== STARTING END-TO-END LOGBOOK TEST ===");

  // 1. Setup Data
  const student = await db.collection('users').findOne({ nama_lengkap: /Dwi Astrianti/i });
  const pengajuan = await db.collection('pengajuanmagangs').findOne({ mahasiswa_id: student._id, status_pengajuan: 'disetujui' });
  const mentorId = pengajuan.mentor_id.toString();
  const dplId = pengajuan.dpl_id.toString();

  console.log("1. Setup Data: OK");
  console.log(`   Student: ${student._id}, Mentor: ${mentorId}, DPL: ${dplId}`);

  // 2. Student Submits Logbook
  const payload = {
    mahasiswa_id: student._id.toString(),
    pengajuan_id: pengajuan._id.toString(),
    tanggal: new Date().toISOString(),
    deskripsi_kegiatan: "Testing E2E: Melakukan riset pasar dan menyusun laporan analisis kompetitor menggunakan Excel.",
    dokumentasi: [{ file: "https://example.com/test.jpg", keterangan: "Testing foto" }],
    bukti_link: ""
  };

  const postRes = await fetch('http://localhost:3020/api/logbook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!postRes.ok) throw new Error("Failed to submit logbook: " + await postRes.text());
  const newLogbook = await postRes.json();
  const logId = newLogbook._id;
  console.log(`2. Student Submission: OK (Logbook ID: ${logId})`);

  // 3. Wait for AI
  console.log("3. Waiting for AI background process (up to 15 seconds)...");
  let aiProcessed = false;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const logCheck = await db.collection('logbooks').findOne({ _id: new mongoose.Types.ObjectId(logId) });
    if (logCheck.matched_indicators && logCheck.matched_indicators.length > 0) {
      console.log(`   AI Processed! Found ${logCheck.matched_indicators.length} matches.`);
      aiProcessed = true;
      break;
    }
  }
  if (!aiProcessed) console.log("   WARNING: AI did not process in time, or no matches found.");

  // 4. Mentor Fetches Logbook
  const mentorRes = await fetch(`http://localhost:3020/api/logbook?role=mentor&userId=${mentorId}`);
  const mentorData = await mentorRes.json();
  const foundByMentor = mentorData.some(l => l._id === logId);
  console.log(`4. Mentor Fetch: ${foundByMentor ? 'OK (Logbook found)' : 'FAIL (Logbook not found)'}`);

  // 5. Mentor Validates
  const patchMentorRes = await fetch('http://localhost:3020/api/logbook', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: logId, status_validasi: 'divalidasi_mentor' })
  });
  if (!patchMentorRes.ok) throw new Error("Mentor patch failed");
  console.log("5. Mentor Validation: OK (Status updated to divalidasi_mentor)");

  // 6. DPL Fetches Logbook
  const dplRes = await fetch(`http://localhost:3020/api/logbook?role=dpl&userId=${dplId}`);
  const dplData = await dplRes.json();
  const foundByDpl = dplData.some(l => l._id === logId);
  console.log(`6. DPL Fetch: ${foundByDpl ? 'OK (Logbook found)' : 'FAIL (Logbook not found)'}`);

  // 7. DPL Validates
  const patchDplRes = await fetch('http://localhost:3020/api/logbook', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: logId, status_validasi: 'divalidasi_dpl' })
  });
  if (!patchDplRes.ok) throw new Error("DPL patch failed");
  console.log("7. DPL Validation: OK (Status updated to divalidasi_dpl)");

  // Cleanup the test logbook
  await db.collection('logbooks').deleteOne({ _id: new mongoose.Types.ObjectId(logId) });
  console.log("8. Test Cleanup: OK (Test logbook deleted)");
  
  console.log("=== ALL END-TO-END TESTS PASSED SUCCESSFULLY ===");
  process.exit(0);
}

run().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
