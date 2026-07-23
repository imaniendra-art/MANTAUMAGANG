const fs = require('fs');

const path = 'app/api/profil/route.js';
let content = fs.readFileSync(path, 'utf8');

// Update destructuring
content = content.replace(
  /const { oldPassword, newPassword, nidn, nomor_hp, email } = await req.json\(\);/,
  'const { oldPassword, newPassword, nidn, nomor_hp, email, nama_lengkap, nim_nidn } = await req.json();'
);

// Add update logic
const targetStr = 'if (nidn !== undefined) user.nidn = nidn;';
const replaceStr = `    if (nama_lengkap) user.nama_lengkap = nama_lengkap;
    if (nim_nidn) {
      const existingUser = await User.findOne({ nim_nidn });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return NextResponse.json({ error: "Username/ID sudah digunakan oleh pengguna lain" }, { status: 400 });
      }
      user.nim_nidn = nim_nidn;
    }
    if (nidn !== undefined) user.nidn = nidn;`;

if (!content.includes('if (nama_lengkap) user.nama_lengkap = nama_lengkap;')) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log("Updated API route!");
} else {
  console.log("API route already updated!");
}
