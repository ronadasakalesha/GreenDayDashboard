import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from '../server/db.js';
import authRouter from '../server/routes/auth.js';
import logsRouter from '../server/routes/logs.js';
import habitsRouter from '../server/routes/habits.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/api/logs', logsRouter);
app.use('/api/habits', habitsRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Cached MongoDB connection for Vercel serverless warm starts
let isConnected = false;

export default async function handler(req: any, res: any) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  app(req, res);
}
