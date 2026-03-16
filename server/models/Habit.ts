import mongoose, { Document, Schema } from 'mongoose';

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  id: string;
  name: string;
  icon: string;
  color: string;
}

const HabitSchema = new Schema<IHabit>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
});

HabitSchema.index({ userId: 1, id: 1 }, { unique: true });

export default mongoose.model<IHabit>('Habit', HabitSchema);
