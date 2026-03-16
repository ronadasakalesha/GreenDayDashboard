import mongoose, { Document, Schema } from 'mongoose';

export interface ILog extends Document {
  userId: mongoose.Types.ObjectId;
  id: string;
  date: string; // 'yyyy-MM-dd'
  performance: number;
  emotions: string[];
  notes: string;
  disciplineScore: number;
  playbookIds: string[];
  assetClass: string;
}

const LogSchema = new Schema<ILog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: String, required: true },
  date: { type: String, required: true },
  performance: { type: Number, required: true },
  emotions: [{ type: String }],
  notes: { type: String, default: '' },
  disciplineScore: { type: Number, default: 0 },
  playbookIds: [{ type: String }],
  assetClass: { type: String, default: 'Stocks' },
});

// Unique log per user per date
LogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<ILog>('Log', LogSchema);
