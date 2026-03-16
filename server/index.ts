import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import authRouter from './routes/auth.js';
import logsRouter from './routes/logs.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/api/logs', logsRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
