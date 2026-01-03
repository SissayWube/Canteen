import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'operator';

export interface IUser extends Document {
  username: string;
  password: string;
  role: UserRole;
  fullName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<IUser> = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
  fullName: String,
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', userSchema);