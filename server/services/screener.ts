import { spawn } from 'child_process';
import ScreenerSignal from '../models/ScreenerSignal.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logToDebug, clearDebugLog } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PYTHON_PATH = path.join(__dirname, '../python/screener.py');

export async function runScreener() {
  clearDebugLog();
  logToDebug('Starting Python Screener Engine...');

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [PYTHON_PATH]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      logToDebug(`[PYTHON-STDERR] ${data.toString().trim()}`);
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        logToDebug(`Python engine exited with code ${code}. Error: ${errorOutput}`);
        return reject(new Error(`Python engine failed: ${errorOutput}`));
      }

      try {
        const signals = JSON.parse(output);
        logToDebug(`Python engine returned ${signals.length} signals.`);

        for (const sig of signals) {
          const grade = sig.nnScore >= 0.80 ? 'A+' : sig.nnScore >= 0.76 ? 'A' : 'B';
          
          const signal = new ScreenerSignal({
            symbol: sig.symbol,
            name: sig.name,
            type: sig.type,
            entryPrice: sig.entryPrice,
            stopLoss: sig.stopLoss,
            target: sig.type === 'BUY' ? sig.entryPrice + (sig.entryPrice - sig.stopLoss) * 2 : sig.entryPrice - (sig.stopLoss - sig.entryPrice) * 2,
            time: new Date(sig.time),
            strategy: `Confluence Suite (Python v2 - Grade ${grade})`,
            timeframe: '1h',
            nnScore: sig.nnScore,
            grade
          });

          await signal.save();
          logToDebug(`Found Signal: ${sig.type} ${sig.symbol} at ${sig.entryPrice} (Score: ${sig.nnScore.toFixed(3)})`);
        }

        resolve(signals);
      } catch (err: any) {
        logToDebug(`Failed to parse Python output: ${err.message}. Raw output: ${output}`);
        reject(err);
      }
    });
  });
}
