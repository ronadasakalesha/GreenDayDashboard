import axios from 'axios';
import crypto from 'crypto';

const API_KEY = process.env.DELTA_EXCHANGE_API_KEY || '';
const API_SECRET = process.env.DELTA_EXCHANGE_API_SECRET || '';
const API_URL = 'https://api.india.delta.exchange';

function generateSignature(method: string, timestamp: string, path: string, query: string, body: string) {
  const payload = timestamp + method + path + query + body;
  return crypto
    .createHmac('sha256', API_SECRET)
    .update(payload)
    .digest('hex');
}

export async function fetchDeltaPnL(date: string) {
  if (!API_KEY || !API_SECRET) {
    throw new Error('Delta Exchange API credentials missing');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const path = '/v2/orders/history';
  const query = ''; 
  const body = '';
  
  const signature = generateSignature('GET', timestamp, path, query, body);

  try {
    const response = await axios.get(`${API_URL}${path}`, {
      headers: {
        'api-key': API_KEY,
        'timestamp': timestamp,
        'signature': signature
      }
    });

    // In production, we would filter and sum P&L here.
    if (process.env.NODE_ENV === 'development' && !API_KEY.startsWith('ELTA')) {
      return 125.50; // Mock value in USD
    }

    return 0; 
  } catch (err: any) {
    console.error('Delta Exchange API Error:', err.response?.data || err.message);
    throw err;
  }
}
