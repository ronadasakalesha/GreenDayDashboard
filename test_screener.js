import { runScreener } from './server/services/screener.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/greenday');
    console.log('Connected to MongoDB');
    await runScreener();
    console.log('Test completed');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
