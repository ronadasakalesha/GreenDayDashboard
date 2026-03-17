/**
 * Simple Supertrend calculation
 * Formula: 
 * Basic Upperband = (High + Low) / 2 + Period * ATR
 * Basic Lowerband = (High + Low) / 2 - Period * ATR
 * 
 * In our case, the user specifies parameters (4, 0.05).
 * Usually Period is the ATR period, and Multiplier is the factor. 
 * User says: "Supertrend is set with parameters that suggest a 5% threshold for price movement" and (4, 0.05).
 * This (4, 0.05) likely means Period=4, Multiplier=0.05.
 */

export function calculateATR(candles: any[], period: number) {
  const atrs = [];
  let trs = [];

  for (let i = 0; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];

    let tr = 0;
    if (!prev) {
      tr = current.high - current.low;
    } else {
      tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - prev.close),
        Math.abs(current.low - prev.close)
      );
    }
    trs.push(tr);

    if (trs.length >= period) {
      const sum = trs.slice(-period).reduce((a, b) => a + b, 0);
      atrs.push(sum / period);
    } else {
      atrs.push(null);
    }
  }
  return atrs;
}

export function calculateSupertrend(candles: any[], period: number, multiplier: number) {
  const atrs = calculateATR(candles, period);
  const supertrend = [];
  let upperbands = [];
  let lowerbands = [];
  let trend = []; // true for bullish, false for bearish

  for (let i = 0; i < candles.length; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const atr = atrs[i];

    if (atr === null) {
      supertrend.push(null);
      upperbands.push(null);
      lowerbands.push(null);
      trend.push(null);
      continue;
    }

    let upperband = hl2 + multiplier * atr;
    let lowerband = hl2 - multiplier * atr;

    if (i > 0 && supertrend[i - 1] !== null) {
      const prevUpper = upperbands[i - 1];
      const prevLower = lowerbands[i - 1];
      const prevClose = candles[i - 1].close;

      if (upperband > prevUpper && prevClose < prevUpper) {
        upperband = prevUpper;
      }

      if (lowerband < prevLower && prevClose > prevLower) {
        lowerband = prevLower;
      }

      // Trend determination
      let currentTrend = trend[i - 1];
      if (currentTrend) {
        // Was Bullish
        if (candles[i].close < supertrend[i - 1]) {
          currentTrend = false;
        }
      } else {
        // Was Bearish
        if (candles[i].close > supertrend[i - 1]) {
          currentTrend = true;
        }
      }
      trend.push(currentTrend);
      
      const st = currentTrend ? lowerband : upperband;
      supertrend.push(st);
    } else {
      trend.push(true);
      supertrend.push(lowerband);
    }

    upperbands.push(upperband);
    lowerbands.push(lowerband);
  }

  return supertrend;
}
