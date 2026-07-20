import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Transactions
  await mongoose.connection.collection('pengajuanmagangs').deleteMany({});
  await mongoose.connection.collection('logbooks').deleteMany({});
  await mongoose.connection.collection('absensis').deleteMany({});
  await mongoose.connection.collection('laporanakhirs').deleteMany({});
  await mongoose.connection.collection('rencanakerjas').deleteMany({});
  await mongoose.connection.collection('logaktivitas').deleteMany({});

  console.log('Transactions cleared!');
  process.exit(0);
}

run();
