// src/models/Settings.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  dailyMealLimit: number;     // Global max meals per employee per day
  companyName: string;        // For ticket header
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId; // Ref to User who changed it
}

const settingsSchema: Schema<ISettings> = new Schema({
  dailyMealLimit: { type: Number, required: true, default: 3, min: 1 },
  companyName: { type: String, default: 'Company Canteen' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { updatedAt: true, createdAt: true } });

// Ensure only one settings document exists
settingsSchema.index({ _id: 1 }, { unique: true });

export default mongoose.model<ISettings>('Settings', settingsSchema);