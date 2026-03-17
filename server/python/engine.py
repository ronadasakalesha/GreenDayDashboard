import pandas as pd
import numpy as np
import pandas_ta as ta

def calculate_sma(series, length):
    return ta.sma(series, length=length)

def calculate_ema(series, length):
    return ta.ema(series, length=length)

def calculate_wma(series, length):
    return ta.wma(series, length=length)

def calculate_hma(series, length):
    return ta.hma(series, length=length)

def calculate_alma(series, length, offset, sigma):
    return ta.alma(series, length=length, offset=offset, sigma=sigma)

def calculate_dema(series, length):
    return ta.dema(series, length=length)

def calculate_atr(high, low, close, length):
    return ta.atr(high, low, close, length=length)

def calculate_rma(series, length):
    return ta.rma(series, length=length)

def calculate_adx(high, low, close, length):
    adx_df = ta.adx(high, low, close, length=length)
    if adx_df is None:
        return pd.Series(0), pd.Series(0), pd.Series(0)
    return adx_df[f'ADX_{length}'], adx_df[f'DMP_{length}'], adx_df[f'DMN_{length}']

def calculate_tanh(x):
    return np.tanh(x)

def calculate_volume_delta(df):
    uV = pd.Series(0.0, index=df.index)
    dV = pd.Series(0.0, index=df.index)
    
    for i in range(1, len(df)):
        c = df['close'].iloc[i]
        h = df['high'].iloc[i]
        l = df['low'].iloc[i]
        o = df['open'].iloc[i]
        v = df['volume'].iloc[i]
        c_prev = df['close'].iloc[i-1]
        
        if (c - l) > (h - c):
            uV.iloc[i] = v
        elif (c - l) < (h - c):
            dV.iloc[i] = -v
        elif c > o:
            uV.iloc[i] = v
        elif c < o:
            dV.iloc[i] = -v
        elif c > c_prev:
            uV.iloc[i] = v
        elif c < c_prev:
            dV.iloc[i] = -v
        else:
            if uV.iloc[i-1] > 0:
                uV.iloc[i] = uV.iloc[i-1] + v
            elif dV.iloc[i-1] < 0:
                dV.iloc[i] = dV.iloc[i-1] - v
                
    return uV, dV

def calculate_nn_score(df):
    close = df['close']
    high = df['high']
    low = df['low']
    
    # 1. AMF Score
    atr14 = calculate_atr(high, low, close, 14)
    fast = calculate_dema(close, 7)
    n = 1.5 * (close - fast) / atr14
    amf_line = n.rolling(10).mean()
    amf_sig = amf_line.rolling(10).apply(lambda x: x.mean(), raw=True) # ema proxy
    amf_score = amf_line.gt(amf_sig).astype(float) * 0.6 - amf_line.lt(amf_sig).astype(float) * 0.6
    
    # 2. ALMA Score
    alma_fast = calculate_alma(close, 20, 0.85, 6.0)
    alma_slow = calculate_alma(close, 20, 0.77, 6.0)
    alma_score = alma_fast.gt(alma_slow).astype(float) * 0.5 - alma_fast.lt(alma_slow).astype(float) * 0.8
    
    # 3. Regime Score (ADX)
    adx, pdi, mdi = calculate_adx(high, low, close, 30)
    regime_score = (adx.ge(60) & pdi.gt(mdi)).astype(float) * 0.7 - (adx.ge(60) & mdi.gt(pdi)).astype(float) * 0.8
    regime_score = regime_score.where(adx.ge(60), -0.2)
    
    # 4. Volume Score
    uV, dV = calculate_volume_delta(df)
    tot = uV.abs() + dV.abs()
    vol_score = (uV + dV) / tot.replace(0, 1)
    
    # 5. Swing Score
    rh = high.rolling(20).max()
    rl = low.rolling(20).min()
    rh_prev = rh.shift(20)
    rl_prev = rl.shift(20)
    swing_score = (rh.gt(rh_prev) & rl.gt(rl_prev)).astype(float) * 0.6 - (rh.lt(rh_prev) & rl.lt(rl_prev)).astype(float) * 0.7
    
    # Final Neural Combination
    h1 = calculate_tanh(1.2*amf_score + 0.4*alma_score + 0.4*swing_score + 0.7*regime_score + 0.8*vol_score + 0.10)
    h2 = calculate_tanh(1.4*amf_score + 0.3*alma_score + 0.3*swing_score + 0.8*regime_score + 0.6*vol_score + 0.05)
    h3 = calculate_tanh(1.6*amf_score + 0.4*alma_score + 0.5*swing_score + 0.6*regime_score + 1.0*vol_score + 0.15)
    
    raw = 0.4*h1 + 0.4*h2 + 0.4*h3
    score = 1.0 / (1.0 + np.exp(-raw))
    
    return score

def calculate_adaptive_supertrend(df, sensitivity=5.0, atr_length=10):
    high = df['high']
    low = df['low']
    close = df['close']
    hl2 = (high + low) / 2
    atr = calculate_atr(high, low, close, atr_length)
    
    # This is a simplified version of the Adaptive Supertrend
    # In a full implementation, we'd do the clustering, 
    # but for the screener, using the sensitivity factor directly is more reliable.
    
    upper = hl2 + atr * sensitivity
    lower = hl2 - atr * sensitivity
    
    trend = pd.Series(1, index=df.index) # 1 for bull, 0 for bear
    st = pd.Series(0.0, index=df.index)
    
    for i in range(1, len(df)):
        if close.iloc[i] > upper.iloc[i-1]:
            trend.iloc[i] = 1
        elif close.iloc[i] < lower.iloc[i-1]:
            trend.iloc[i] = 0
        else:
            trend.iloc[i] = trend.iloc[i-1]
            if trend.iloc[i] == 1 and lower.iloc[i] < lower.iloc[i-1]:
                lower.iloc[i] = lower.iloc[i-1]
            if trend.iloc[i] == 0 and upper.iloc[i] > upper.iloc[i-1]:
                upper.iloc[i] = upper.iloc[i-1]
        
        st.iloc[i] = lower.iloc[i] if trend.iloc[i] == 1 else upper.iloc[i]
        
    return st, trend
