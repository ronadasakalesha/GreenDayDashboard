import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSTRUMENT_URL = 'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';
const OUTPUT_FILE = path.join(__dirname, '../data/instruments.json');

async function downloadInstruments() {
  try {
    console.log('Downloading instrument list...');
    const response = await axios.get(INSTRUMENT_URL);
    const data = response.data;

    // Filter for NSE and F&O (approximate logic: symbols ending in -EQ are often stocks, but for F&O we look at certain types or instruments)
    // Actually, Angel One has 'exch_seg' which can be 'NFO' for F&O.
    // However, the user wants stocks to scan. Usually, this means the underlying stocks of F&O contracts.
    
    const filtered = data.filter((item: any) => {
      // Keep NSE stocks (EQ) that are part of the main market
      // And also consider NFO for future tokens if needed, but usually we scan underlying.
      return item.exch_seg === 'NSE' && item.symbol.endsWith('-EQ');
    });

    console.log(`Filtered ${filtered.length} instruments.`);
    
    // Ensure directory exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filtered, null, 2));
    console.log(`Saved instruments to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error downloading instruments:', error);
  }
}

downloadInstruments();
