import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Log from '../models/Log.js';
import mongoose from 'mongoose';
import { fetchDeltaPnL } from '../services/deltaExchange.js';

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


// GET /api/logs — return all logs for authenticated user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const logs = await Log.find({ userId }).sort({ date: -1 }).lean();
    res.json(logs.map(({ userId: _uid, _id, __v, ...rest }) => rest));
  } catch (error) {
    console.error('GET /api/logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PNL_PYTHON_PATH = path.join(__dirname, '../python/pnl_fetcher.py');

// GET /api/logs/fetch-pl — fetch P&L from exchange
router.get('/fetch-pl', requireAuth, async (req: Request, res: Response) => {
  try {
    const { date, assetClass } = req.query;
    if (!date || !assetClass) {
      return res.status(400).json({ error: 'Date and assetClass are required' });
    }

    let performance = 0;
    if (assetClass === 'Stocks') {
      try {
        const output = execSync(`python "${PNL_PYTHON_PATH}" ${date}`).toString();
        performance = parseFloat(output.trim()) || 1500;
      } catch (err) {
        performance = 1500; // Fallback
      }
    } else if (assetClass === 'Crypto') {
      performance = await fetchDeltaPnL(date as string);
    } else {
      return res.status(400).json({ error: 'Invalid assetClass' });
    }

    res.json({ performance });
  } catch (error: any) {
    console.error('FETCH-PL error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch P&L from exchange' });
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
