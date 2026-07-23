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
  
  const Logbook = mongoose.connection.collection('logbooks');
  const Pengajuan = mongoose.connection.collection('pengajuanmagangs');
  
  // Find all logbooks
  const logs = await Logbook.find({}).toArray();
  let deletedCount = 0;
  
  for (const log of logs) {
    const p = await Pengajuan.findOne({ _id: log.pengajuan_id });
    if (!p) {
      await Logbook.deleteOne({ _id: log._id });
      deletedCount++;
    }
  }
  
  console.log(`Deleted ${deletedCount} orphaned logbooks.`);
  process.exit(0);
}
run().catch(console.error);
