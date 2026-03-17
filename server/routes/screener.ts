import express from 'express';
import ScreenerSignal from '../models/ScreenerSignal.js';
import { runScreener } from '../services/screener.js';

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
    // We run it asynchronously so the request doesn't timeout
    runScreener();
    res.json({ message: 'Scan started in background' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
