const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({
  nama_lengkap: String,
  nim_nidn: String,
  nidn: String
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function check() {
  const riswan = await User.findOne({ nim_nidn: 'riswan' });
  console.log(riswan);
  process.exit();
}
check();
