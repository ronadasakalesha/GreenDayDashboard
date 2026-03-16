import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from '../server/db.js';
import authRouter from '../server/routes/auth.js';
import logsRouter from '../server/routes/logs.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/api/logs', logsRouter);

// Health check — shows DB connection status for debugging
app.get('/health', async (_req, res) => {
  try {
    await connectDB();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

// Cached MongoDB connection across warm serverless invocations
let dbReady = false;
let dbError: string | null = null;

export default async function handler(req: any, res: any) {
  if (!dbReady) {
    try {
      await connectDB();
      dbReady = true;
      dbError = null;
    } catch (err: any) {
      dbError = err.message;
      console.error('MongoDB connection failed:', err);
      return res.status(500).json({
        error: 'Database connection failed',
        detail: err.message,
      });
    }
  }

  if (dbError) {
    return res.status(500).json({ error: 'Database unavailable', detail: dbError });
  }

  app(req, res);
}
