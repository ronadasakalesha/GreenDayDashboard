import os
import sys
import json
from dotenv import load_dotenv
from SmartApi import SmartConnect
import pyotp

# Load environment variables
load_dotenv()

API_KEY = os.getenv('ANGEL_ONE_API_KEY')
CLIENT_CODE = os.getenv('ANGEL_ONE_CLIENT_CODE')
PASSWORD = os.getenv('ANGEL_ONE_PASSWORD')
TOTP_SECRET = os.getenv('ANGEL_ONE_TOTP_SECRET')

def get_session():
    if not all([API_KEY, CLIENT_CODE, PASSWORD, TOTP_SECRET]):
        return None
    
    try:
        smart_api = SmartConnect(api_key=API_KEY)
        totp = pyotp.TOTP(TOTP_SECRET).now()
        data = smart_api.generateSession(CLIENT_CODE, PASSWORD, totp)
        
        if data['status'] == False:
            return None
        return smart_api
    except Exception:
        return None

def fetch_pnl(date_str):
    smart_api = get_session()
    if not smart_api:
        # Return mock PnL if credentials are missing (dev mode)
        return 1500
    
    # In a real scenario, we would use smart_api to fetch actual PnL
    # For now, keeping the same logic as the TS version
    return 1500

if __name__ == "__main__":
    if len(sys.argv) > 1:
        date = sys.argv[1]
        print(fetch_pnl(date))
    else:
        print(fetch_pnl(None))
