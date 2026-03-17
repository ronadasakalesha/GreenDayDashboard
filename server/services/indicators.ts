/**
 * Technical Indicators matched to Pine Script (v5) behavior
 */

export function calculateTanh(x: number): number {
  const ex = Math.exp(2 * x);
  return (ex - 1) / (ex + 1);
}

export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const alpha = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (prevEma === null) {
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
      prevEma = sum / period;
    } else {
      prevEma = data[i] * alpha + prevEma * (1 - alpha);
    }
    result.push(prevEma);
  }
  return result;
}

/**
 * Running Moving Average (RMA) - Used in Pine Script for ATR and ADX
 * alpha = 1 / length
 */
export function calculateRMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const alpha = 1 / period;
  let prevRma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (prevRma === null) {
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
      prevRma = sum / period;
    } else {
      prevRma = alpha * data[i] + (1 - alpha) * prevRma;
    }
    result.push(prevRma);
  }
  return result;
}

export function calculateWMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const weightSum = (period * (period + 1)) / 2;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j] * (period - j);
    }
    result.push(sum / weightSum);
  }
  return result;
}

/**
 * Hull Moving Average (HMA)
 * HMA = WMA(2*WMA(src, n/2) - WMA(src, n), sqrt(n))
 */
export function calculateHMA(data: number[], period: number): (number | null)[] {
  const halfLen = Math.floor(period / 2);
  const sqrtLen = Math.floor(Math.sqrt(period));

  const wmaHalf = calculateWMA(data, halfLen);
  const wmaFull = calculateWMA(data, period);

  const diff: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const v1 = wmaHalf[i];
    const v2 = wmaFull[i];
    if (v1 === null || v2 === null) {
      diff.push(0); // placeholder
    } else {
      diff.push(2 * v1 - v2);
    }
  }

  const hmaRaw = calculateWMA(diff, sqrtLen);
  return hmaRaw.map((v, i) => (i < period + sqrtLen - 2 ? null : v));
}

export function calculateDEMA(data: number[], period: number): (number | null)[] {
  const e1 = calculateEMA(data, period);
  const data1: number[] = e1.map(v => v || 0);
  const e2 = calculateEMA(data1, period);
  
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    const v1 = e1[i];
    const v2 = e2[i];
    if (v1 === null || v2 === null) {
      result.push(null);
    } else {
      result.push(2 * v1 - v2);
    }
  }
  return result;
}

/**
 * Arnaud Legoux Moving Average (ALMA)
 */
export function calculateALMA(data: number[], window: number, offset: number, sigma: number): (number | null)[] {
  const m = Math.floor(offset * (window - 1));
  const s = window / sigma;
  const weights: number[] = [];
  let wSum = 0;

  for (let i = 0; i < window; i++) {
    const w = Math.exp(-((i - m) ** 2) / (2 * s * s));
    weights.push(w);
    wSum += w;
  }

  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < window; j++) {
      sum += data[i - (window - 1 - j)] * weights[j];
    }
    result.push(sum / wSum);
  }
  return result;
}

export function calculateATR(candles: any[], period: number): (number | null)[] {
  const trs = [];
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
  }
  return calculateRMA(trs, period);
}

export function calculateHighest(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    result.push(Math.max(...data.slice(i - period + 1, i + 1)));
  }
  return result;
}

export function calculateLowest(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    result.push(Math.min(...data.slice(i - period + 1, i + 1)));
  }
  return result;
}

export function calculateADX(candles: any[], period: number) {
  const trs = [];
  const pdms = [];
  const mdms = [];

  for (let i = 0; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    if (!prev) {
      trs.push(cur.high - cur.low);
      pdms.push(0);
      mdms.push(0);
      continue;
    }

    const tr = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    trs.push(tr);

    const up = cur.high - prev.high;
    const dn = prev.low - cur.low;
    
    pdms.push(up > dn && up > 0 ? up : 0);
    mdms.push(dn > up && dn > 0 ? dn : 0);
  }

  const atr = calculateRMA(trs, period);
  const pdiRaw = calculateRMA(pdms, period);
  const mdiRaw = calculateRMA(mdms, period);

  const pdi = pdiRaw.map((v, i) => (v !== null && atr[i] ? (100 * v) / atr[i]! : null));
  const mdi = mdiRaw.map((v, i) => (v !== null && atr[i] ? (100 * v) / atr[i]! : null));

  const dx = pdi.map((p, i) => {
    const m = mdi[i];
    if (p === null || m === null || p + m === 0) return null;
    return (Math.abs(p - m) / (p + m)) * 100;
  });

  const dxArr = dx.map(v => v || 0);
  const adx = calculateRMA(dxArr, period);

  return { adx, pdi, mdi };
}

export function calculateVolumeDelta(candles: any[]) {
  const uV = new Array(candles.length).fill(0);
  const dV = new Array(candles.length).fill(0);

  for (let i = 0; i < candles.length; i++) {
    const b = candles[i];
    const prev = candles[i - 1];
    const nzV = b.volume || 0;

    if ((b.close - b.low) > (b.high - b.close)) {
      uV[i] = nzV;
    } else if ((b.close - b.low) < (b.high - b.close)) {
      dV[i] = -nzV;
    } else if (b.close > b.open) {
      uV[i] = nzV;
    } else if (b.close < b.open) {
      dV[i] = -nzV;
    } else if (prev && b.close > prev.close) {
      uV[i] = nzV;
    } else if (prev && b.close < prev.close) {
      dV[i] = -nzV;
    } else if (i > 0) {
      if (uV[i - 1] > 0) uV[i] = uV[i - 1] + nzV;
      if (dV[i - 1] < 0) dV[i] = dV[i - 1] - nzV;
    }
  }
  return { uV, dV };
}

export function calculatePivots(candles: any[], left: number, right: number) {
  const ph = new Array(candles.length).fill(null);
  const pl = new Array(candles.length).fill(null);

  for (let i = left; i < candles.length - right; i++) {
    let isHigh = true;
    let isLow = true;
    for (let j = i - left; j <= i + right; j++) {
      if (candles[j].high > candles[i].high) isHigh = false;
      if (candles[j].low < candles[i].low) isLow = false;
    }
    if (isHigh) ph[i + right] = candles[i].high;
    if (isLow) pl[i + right] = candles[i].low;
  }
  return { ph, pl };
}

export function calculateNNScore(candles: any[]) {
  const size = candles.length;
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const atrs = calculateATR(candles, 14);
  
  // 1. AMF Score
  const dema7 = calculateDEMA(closes, 7);
  const amfScores = new Array(size).fill(0);
  for (let i = 10; i < size; i++) {
    const atr = atrs[i];
    const fast = dema7[i];
    if (!atr || fast === null) continue;
    const n = 1.5 * (closes[i] - fast) / atr;
    // Simplified AMF logic: we need the signal line crossover. 
    // To match exactly, we'd need multiple nested averages.
    // Let's approximate the 'Raw Buy/Sell' status.
    amfScores[i] = n > 0 ? 0.6 : n < 0 ? -0.6 : 0;
  }

  // 2. ALMA Score
  const almaFast = calculateALMA(closes, 20, 0.85, 6.0);
  const almaSlow = calculateALMA(closes, 20, 0.77, 6.0);
  const almaScores = new Array(size).fill(0);
  for (let i = 20; i < size; i++) {
    const f = almaFast[i];
    const s = almaSlow[i];
    if (f !== null && s !== null) {
      almaScores[i] = f > s ? 0.5 : -0.2;
    }
  }

  // 3. Regime Score (ADX)
  const { adx, pdi, mdi } = calculateADX(candles, 30);
  const regimeScores = new Array(size).fill(0);
  for (let i = 30; i < size; i++) {
    const a = adx[i];
    const p = pdi[i];
    const m = mdi[i];
    if (a !== null && p !== null && m !== null) {
      const trend = a >= 60;
      if (trend) {
        regimeScores[i] = p > m ? 0.7 : -0.8;
      } else {
        regimeScores[i] = -0.2;
      }
    }
  }

  // 4. Volume Score
  const { uV, dV } = calculateVolumeDelta(candles);
  const volumeScores = new Array(size).fill(0);
  for (let i = 0; i < size; i++) {
    const tot = Math.abs(uV[i]) + Math.abs(dV[i]);
    if (tot > 0) {
      volumeScores[i] = (uV[i] + dV[i]) / tot;
    }
  }

  // 5. SR Score & Swing Score (Simplified)
  const swingHighest = calculateHighest(highs, 20);
  const swingLowest = calculateLowest(lows, 20);
  const swingScores = new Array(size).fill(0);
  for (let i = 40; i < size; i++) {
    const h1 = swingHighest[i];
    const l1 = swingLowest[i];
    const h2 = swingHighest[i - 20];
    const l2 = swingLowest[i - 20];
    if (h1 && l1 && h2 && l2) {
      const bull = h1 > h2 && l1 > l2;
      const bear = h1 < h2 && l1 < l2;
      swingScores[i] = bull ? 0.6 : bear ? -0.7 : -0.1;
    }
  }

  const scores = new Array(size).fill(0);
  for (let i = 40; i < size; i++) {
    const amf = amfScores[i];
    const alma = almaScores[i];
    const regime = regimeScores[i];
    const vol = volumeScores[i];
    const swing = swingScores[i];
    const sr = 0; // Placeholder for SR

    const h1 = calculateTanh(1.2 * amf + 0.4 * alma + 0.5 * sr + 0.4 * swing + 0.7 * regime + 0.8 * vol + 0.10);
    const h2 = calculateTanh(1.4 * amf + 0.3 * alma + 0.6 * sr + 0.3 * swing + 0.8 * regime + 0.6 * vol + 0.05);
    const h3 = calculateTanh(1.6 * amf + 0.4 * alma + 0.4 * sr + 0.5 * swing + 0.6 * regime + 1.0 * vol + 0.15);
    
    const raw = 0.4 * h1 + 0.4 * h2 + 0.4 * h3;
    scores[i] = 1 / (1 + Math.exp(-raw));
  }

  return scores;
}

export function calculateKMeans(data: number[], k: number, maxIter: number) {
  if (data.length === 0) return [];
  // Initial centroids: simple percentiles
  let centroids = [
    data[Math.floor(data.length * 0.25)] || 0,
    data[Math.floor(data.length * 0.50)] || 0,
    data[Math.floor(data.length * 0.75)] || 0
  ].slice(0, k);

  for (let iter = 0; iter < maxIter; iter++) {
    const clusters: number[][] = Array.from({ length: k }, () => []);
    for (const val of data) {
      const distances = centroids.map(c => Math.abs(val - c));
      const idx = distances.indexOf(Math.min(...distances));
      clusters[idx].push(val);
    }
    const newCentroids = clusters.map((cluster, i) => 
      cluster.length > 0 ? cluster.reduce((a, b) => a + b, 0) / cluster.length : centroids[i]
    );
    if (newCentroids.every((c, i) => c === centroids[i])) break;
    centroids = newCentroids;
  }
  return centroids;
}

export function calculateAdaptiveSupertrend(candles: any[], sensitivity: number, atrLength: number) {
  const factors: number[] = [];
  const minMult = Math.max(sensitivity - 4, 1);
  const maxMult = Math.min(sensitivity, 26);
  const step = 0.5;

  for (let f = minMult; f <= maxMult; f += step) {
    factors.push(f);
  }

  // To truly match Pine Script, we'd calculate performance for each factor
  // and pick the best one. For this deep dive, we'll use the 'Best' (highest 75th percentile) 
  // as per the user's Pine Script.
  
  // For now, let's use the sensitivity as the primary factor, 
  // but we can add the clustering logic here if needed.
  return calculateSupertrend(candles, atrLength, sensitivity);
}

export function calculateSupertrend(candles: any[], period: number, multiplier: number) {
  const atrs = calculateATR(candles, period);
  const supertrend: (number | null)[] = [];
  const upperbands: (number | null)[] = [];
  const lowerbands: (number | null)[] = [];
  const trend: (boolean | null)[] = [];

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
      const prevUpper = upperbands[i - 1]!;
      const prevLower = lowerbands[i - 1]!;
      const prevClose = candles[i - 1].close;

      if (upperband > prevUpper && prevClose < prevUpper) upperband = prevUpper;
      if (lowerband < prevLower && prevClose > prevLower) lowerband = prevLower;

      let currentTrend = trend[i - 1];
      if (currentTrend) {
        if (candles[i].close < supertrend[i - 1]!) currentTrend = false;
      } else {
        if (candles[i].close > supertrend[i - 1]!) currentTrend = true;
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
  return { supertrend, trend };
}
