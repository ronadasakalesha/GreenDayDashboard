import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
