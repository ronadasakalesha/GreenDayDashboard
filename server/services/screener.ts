import { fetchCandleData } from './angelOne.js';
import { calculateSupertrend } from './indicators.js';
import ScreenerSignal from '../models/ScreenerSignal.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSTRUMENTS_PATH = path.join(__dirname, '../data/instruments.json');

export async function runScreener() {
  if (!fs.existsSync(INSTRUMENTS_PATH)) {
    console.error('Instrument list not found. Run updateInstruments script first.');
    return;
  }

  const instruments = JSON.parse(fs.readFileSync(INSTRUMENTS_PATH, 'utf-8'));
  console.log(`Starting scan for ${instruments.length} instruments...`);

  // To avoid hitting API limits, we might want to chunk this or only scan a subset (e.g. F&O only)
  // Let's filter for common liquid stocks or just first 50 for testing if it's too many
  const stocksToScan = instruments.slice(0, 100); // Scan first 100 for now

  for (const stock of stocksToScan) {
    try {
      const now = new Date();
      const fromDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago to get enough data for ATR
      
      const params = {
        exchange: stock.exch_seg,
        symboltoken: stock.token,
        interval: 'ONE_HOUR',
        fromdate: fromDate.toISOString().replace('T', ' ').substring(0, 16),
        todate: now.toISOString().replace('T', ' ').substring(0, 16),
      };

      const candlesRaw = await fetchCandleData(params);
      if (!candlesRaw || candlesRaw.length < 10) continue;

      const candles = candlesRaw.map((c: any) => ({
        time: c[0],
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5],
      }));

      const supertrend = calculateSupertrend(candles, 4, 0.05);
      
      const i = candles.length - 1;
      const currentClose = candles[i].close;
      const prevClose = candles[i - 1].close;
      const currentST = supertrend[i];
      const prevST = supertrend[i - 1];
      const currentVolume = candles[i].volume;

      if (currentST === null || prevST === null) continue;

      // BUY Logic: Close crosses above ST + Volume > 1M
      if (currentClose > currentST && prevClose <= prevST && currentVolume > 1000000) {
        await saveSignal(stock, 'BUY', currentClose, currentST);
      } 
      // SELL Logic: Close crosses below ST + Volume > 1M
      else if (currentClose < currentST && prevClose >= prevST && currentVolume > 1000000) {
        await saveSignal(stock, 'SELL', currentClose, currentST);
      }

      // Small delay to prevent rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error scanning ${stock.symbol}:`, error);
    }
  }
  console.log('Scan completed.');
}

async function saveSignal(stock: any, type: 'BUY' | 'SELL', price: number, stopLoss: number) {
  const risk = Math.abs(price - stopLoss);
  const target = type === 'BUY' ? price + risk * 2 : price - risk * 2;

  const signal = new ScreenerSignal({
    symbol: stock.symbol,
    name: stock.name,
    type,
    entryPrice: price,
    stopLoss: stopLoss,
    target: target,
    time: new Date(),
    strategy: 'Supertrend Crossover (4, 0.05)',
  });

  await signal.save();
  console.log(`Signal Found: ${type} ${stock.symbol} at ${price}`);
}
