import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Habit from '../models/Habit.js';
import mongoose from 'mongoose';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

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


// GET /api/habits
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const habits = await Habit.find({ userId }).lean();
    res.json(habits.map(({ userId: _uid, _id, __v, ...rest }) => rest));
  } catch (error) {
    console.error('GET /api/habits error:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// POST /api/habits — create or update a habit
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const habitData = req.body;

    const habit = await Habit.findOneAndUpdate(
      { userId, id: habitData.id },
      { $set: { ...habitData, userId } },
      { upsert: true, new: true }
    ).lean();

    const { userId: _uid, _id, __v, ...clean } = habit as any;
    res.json(clean);
  } catch (error) {
    console.error('POST /api/habits error:', error);
    res.status(500).json({ error: 'Failed to save habit' });
  }
});

export default router;
