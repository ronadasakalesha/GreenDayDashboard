import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import authRouter from './routes/auth.js';
import logsRouter from './routes/logs.js';
import habitsRouter from './routes/habits.js';

const app = express();
const PORT = process.env.PORT || 4000;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

app.use(cors({ origin: APP_URL, credentials: true }));
app.use(express.json());

app.use('/auth', authRouter);
app.use('/api/logs', logsRouter);
app.use('/api/habits', habitsRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
