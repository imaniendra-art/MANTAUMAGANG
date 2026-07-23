const { default: mongoose } = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const ids = ['6a60d90a317d1e8f2197d1e3', '6a60e47d9cd0a0e9b0334840'];
  
  for (const userId of ids) {
    try {
      const res = await fetch(`http://localhost:3020/api/logbook?role=mentor&userId=${userId}`);
      const data = await res.json();
      console.log(`Mentor ${userId} API response length:`, data.length);
    } catch(e) {
      console.error(`Error fetching for mentor ${userId}:`, e.message);
    }
  }
  
  process.exit(0);
}
run().catch(console.error);
