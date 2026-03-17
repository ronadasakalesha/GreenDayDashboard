// @ts-ignore
import { SmartAPI } from 'smartapi-javascript';
import { generateSync } from 'otplib';

const API_KEY = process.env.ANGEL_ONE_API_KEY || '';
const CLIENT_CODE = process.env.ANGEL_ONE_CLIENT_CODE || '';
const PASSWORD = process.env.ANGEL_ONE_PASSWORD || '';
const TOTP_SECRET = process.env.ANGEL_ONE_TOTP_SECRET || '';

let cachedSession: any = null;
let lastLoginTime = 0;
const SESSION_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours

async function getSession() {
  if (cachedSession && (Date.now() - lastLoginTime < SESSION_EXPIRY)) {
    return cachedSession;
  }

  if (!API_KEY || !CLIENT_CODE || !PASSWORD || !TOTP_SECRET) {
    throw new Error('Angel One API credentials missing');
  }

  const smart_api = new SmartAPI({
    api_key: API_KEY,
  });

  const totp = generateSync({ secret: TOTP_SECRET });
  const session = await smart_api.generateSession(CLIENT_CODE, PASSWORD, totp);

  if (!session.status) {
    throw new Error(session.message || 'Login failed');
  }

  cachedSession = session.data;
  lastLoginTime = Date.now();
  return cachedSession;
}

export async function fetchAngelOnePnL(date: string) {
  try {
    await getSession();
    // Mock response for development
    if (process.env.NODE_ENV === 'development' && !API_KEY.startsWith('ANGEL')) {
      return 1500; 
    }
    return 0;
  } catch (err: any) {
    console.error('Angel One API Error:', err);
    throw err;
  }
}

export async function fetchCandleData(params: {
  exchange: string;
  symboltoken: string;
  interval: string;
  fromdate: string;
  todate: string;
}) {
  const session = await getSession();
  const smart_api = new SmartAPI({
    api_key: API_KEY,
    jwtToken: session.jwtToken,
  });

  try {
    const response = await smart_api.getCandleData(params);
    if (!response.status) {
      throw new Error(response.message || 'Failed to fetch candle data');
    }
    return response.data; // Array of [Time, Open, High, Low, Close, Volume]
  } catch (err: any) {
    console.error('Error fetching candle data:', err);
    throw err;
  }
}
