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
  
  const latestLog = await Logbook.find({}).sort({ createdAt: -1 }).limit(1).toArray();
  if (latestLog.length > 0) {
    console.log(JSON.stringify(latestLog[0], null, 2));
  } else {
    console.log("No logbooks found.");
  }
  
  process.exit(0);
}
run().catch(console.error);
