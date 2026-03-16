import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Log from '../models/Log.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { format } from 'date-fns';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Middleware: verify JWT and attach userId
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    (req as any).userId = new mongoose.Types.ObjectId(decoded.id);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const EMOTIONS = ['Calm', 'FOMO', 'Stressed', 'Motivated', 'Disciplined', 'Anxious', 'Confident'];
const INITIAL_HABITS = [
  { id: '1', name: 'Deep Work', icon: 'Zap', color: 'text-blue-500' },
  { id: '2', name: 'Exercise', icon: 'Activity', color: 'text-emerald-500' },
  { id: '3', name: 'Meditation', icon: 'Brain', color: 'text-purple-500' },
  { id: '4', name: 'Reading', icon: 'Book', color: 'text-orange-500' },
];
const INITIAL_PLAYBOOKS = ['p1', 'p2', 'p3', 'p4'];

// GET /api/logs — return all logs for authenticated user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const logs = await Log.find({ userId }).sort({ date: -1 }).lean();

    // Seed with 31 days of sample data if user has no logs
    if (logs.length === 0) {
      const today = new Date();
      const seedLogs = [];
      for (let i = 30; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const perf = Math.floor(Math.random() * 21) - 10;
        const logId = Math.random().toString(36).substr(2, 9);
        seedLogs.push({
          userId,
          id: logId,
          date: format(d, 'yyyy-MM-dd'),
          performance: perf,
          emotions: [EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)]],
          notes: 'Sample entry',
          disciplineScore: Math.floor(Math.random() * 40) + 60,
          habits: INITIAL_HABITS.map(h => ({ id: h.id, completed: Math.random() > 0.3 })),
          playbookIds: [INITIAL_PLAYBOOKS[Math.floor(Math.random() * INITIAL_PLAYBOOKS.length)]],
          assetClass: Math.random() > 0.5 ? 'Stocks' : 'Crypto',
        });
      }
      await Log.insertMany(seedLogs);
      return res.json(seedLogs.map(({ userId: _uid, ...rest }) => rest));
    }

    res.json(logs.map(({ userId: _uid, _id, __v, ...rest }) => rest));
  } catch (error) {
    console.error('GET /api/logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST /api/logs — create or upsert a log (matched by date)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const logData = req.body;

    const existing = await Log.findOneAndUpdate(
      { userId, date: logData.date },
      { $set: { ...logData, userId } },
      { upsert: true, new: true }
    ).lean();

    const { userId: _uid, _id, __v, ...clean } = existing as any;
    res.json(clean);
  } catch (error) {
    console.error('POST /api/logs error:', error);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

// DELETE /api/logs/:id — delete a log
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await Log.deleteOne({ userId, id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/logs error:', error);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

export default router;
