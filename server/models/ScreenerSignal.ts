import mongoose, { Schema, Document } from 'mongoose';

export interface IScreenerSignal extends Document {
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  target: number;
  time: Date;
  timeframe: string;
  strategy: string;
  nnScore: number;
  grade: string;
}

const ScreenerSignalSchema: Schema = new Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  entryPrice: { type: Number, required: true },
  stopLoss: { type: Number, required: true },
  target: { type: Number, required: true },
  time: { type: Date, default: Date.now },
  timeframe: { type: String, default: '1h' },
  strategy: { type: String, default: 'Supertrend Crossover' },
  nnScore: { type: Number, default: 0 },
  grade: { type: String, default: 'N/A' },
});

export default mongoose.model<IScreenerSignal>('ScreenerSignal', ScreenerSignalSchema);
