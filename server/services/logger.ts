import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, '../../screener_debug.log');

export function logToDebug(msg: string) {
    const time = new Date().toISOString();
    const entry = `[${time}] ${msg}\n`;
    try {
        fs.appendFileSync(LOG_FILE, entry);
    } catch (err) {
        console.error('Failed to write to debug log:', err);
    }
}

export function clearDebugLog() {
    try {
        fs.writeFileSync(LOG_FILE, `Log cleared at ${new Date().toISOString()}\n`);
    } catch (err) {}
}

export const DEBUG_LOG_PATH = LOG_FILE;
