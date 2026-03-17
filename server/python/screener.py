import os
import sys
import json
import time
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
from SmartApi import SmartConnect
import pyotp
from engine import calculate_nn_score, calculate_adaptive_supertrend

# Load environment variables
load_dotenv()

API_KEY = os.getenv('ANGEL_ONE_API_KEY')
CLIENT_CODE = os.getenv('ANGEL_ONE_CLIENT_CODE')
PASSWORD = os.getenv('ANGEL_ONE_PASSWORD')
TOTP_SECRET = os.getenv('ANGEL_ONE_TOTP_SECRET')

def get_session():
    if not all([API_KEY, CLIENT_CODE, PASSWORD, TOTP_SECRET]):
        return None
    
    smart_api = SmartConnect(api_key=API_KEY)
    totp = pyotp.TOTP(TOTP_SECRET).now()
    data = smart_api.generateSession(CLIENT_CODE, PASSWORD, totp)
    
    if data['status'] == False:
        return None
    
    return smart_api

def fetch_data(smart_api, symbol, token, exchange='NSE'):
    if smart_api is None:
        # Generate synthetic data for testing/mock mode
        candles = []
        price = 1000.0 + np.random.random() * 500
        now = datetime.now()
        for i in range(200):
            time_val = now - timedelta(hours=200-i)
            o = price
            h = price + np.random.random() * 10
            l = price - np.random.random() * 10
            c = (o + h + l) / 3 + (np.random.random() - 0.45) * 5
            v = 100000 + np.random.random() * 500000
            candles.append([time_val.strftime('%Y-%m-%d %H:%M'), o, h, l, c, v])
            price = c
        df = pd.DataFrame(candles, columns=['time', 'open', 'high', 'low', 'close', 'volume'])
        df['time'] = pd.to_datetime(df['time'])
        for col in ['open', 'high', 'low', 'close', 'volume']:
            df[col] = pd.to_numeric(df[col])
        return df

    to_date = datetime.now().strftime('%Y-%m-%d %H:%M')
    from_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d %H:%M')
    
    params = {
        "exchange": exchange,
        "symboltoken": token,
        "interval": "ONE_HOUR",
        "fromdate": from_date,
        "todate": to_date
    }
    
    try:
        response = smart_api.getCandleData(params)
        if response is None or response.get('status') == False:
            return None
        
        df = pd.DataFrame(response['data'], columns=['time', 'open', 'high', 'low', 'close', 'volume'])
        df['time'] = pd.to_datetime(df['time'])
        for col in ['open', 'high', 'low', 'close', 'volume']:
            df[col] = pd.to_numeric(df[col])
        return df
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}", file=sys.stderr)
        return None

def run_screener():
    instruments_path = os.path.join(os.path.dirname(__file__), '../data/instruments.json')
    if not os.path.exists(instruments_path):
        print("Instruments list not found.", file=sys.stderr)
        return
    
    with open(instruments_path, 'r') as f:
        instruments = json.load(f)
    
    # Use first 50 for testing speed
    stocks_to_scan = instruments[:100]
    
    smart_api = get_session()
    if not smart_api:
        # Fallback to mock data if credentials missing
        print("Angel One API credentials missing. Using Mock Data Mode.", file=sys.stderr)
        # For testing, we could implement mock data here, 
        # but let's assume we want real signals.
    
    signals = []
    
    for stock in stocks_to_scan:
        df = fetch_data(smart_api, stock['symbol'], stock['token'], stock['exch_seg'])
        if df is None or len(df) < 100:
            continue
            
        # Calculate indicators
        nn_scores = calculate_nn_score(df)
        st, trends = calculate_adaptive_supertrend(df)
        
        i = len(df) - 1
        current_nn_score = nn_scores.iloc[i]
        current_trend = trends.iloc[i]
        prev_trend = trends.iloc[i-1]
        
        # Signal Logic
        STRONG_THRESHOLD = 0.76
        
        # Check for trend flip in last 3 bars
        flip = False
        flip_type = None
        for j in range(3):
            idx = i - j
            if idx <= 0: break
            if trends.iloc[idx] == 1 and trends.iloc[idx-1] == 0:
                flip = True
                flip_type = 'BUY'
                break
            elif trends.iloc[idx] == 0 and trends.iloc[idx-1] == 1:
                flip = True
                flip_type = 'SELL'
                break
        
        if flip and current_nn_score >= STRONG_THRESHOLD:
            signals.append({
                "symbol": stock['symbol'],
                "name": stock['name'],
                "type": flip_type,
                "entryPrice": float(df['close'].iloc[i]),
                "stopLoss": float(st.iloc[i]),
                "nnScore": float(current_nn_score),
                "time": datetime.now().isoformat()
            })
            
        time.sleep(0.2) # Rate limit protection

    print(json.dumps(signals))

if __name__ == "__main__":
    run_screener()
