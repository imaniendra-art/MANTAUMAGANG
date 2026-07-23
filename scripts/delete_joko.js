const { default: mongoose } = require('mongoose');
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
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find duplicate joko and delete
  const res = await mongoose.connection.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId('6a60e47d9cd0a0e9b0334840') });
  console.log("Deleted joko:", res.deletedCount);
  
  // To be absolutely safe, let's also update the DPL API and mentor validasi fetch to use no-store cache
  process.exit(0);
}
run().catch(console.error);
