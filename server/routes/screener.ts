import express from 'express';
import fs from 'fs';
import ScreenerSignal from '../models/ScreenerSignal.js';
import { runScreener } from '../services/screener.js';
import { logToDebug, DEBUG_LOG_PATH } from '../services/logger.js';

const router = express.Router();

// Get recent signals
router.get('/signals', async (req, res) => {
  try {
    const signals = await ScreenerSignal.find().sort({ time: -1 }).limit(50);
    res.json(signals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger a manual scan
router.post('/scan', async (req, res) => {
  try {
    runScreener();
    res.json({ message: 'Scan started in background' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET debug logs
router.get('/debug', (req, res) => {
  if (!fs.existsSync(DEBUG_LOG_PATH)) {
    return res.json({ message: 'No debug log found.' });
  }
  const content = fs.readFileSync(DEBUG_LOG_PATH, 'utf-8');
  res.send(`<pre>${content}</pre>`);
});

export default router;
