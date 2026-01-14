// src/models/Customer.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    deviceId: string;      // Must match the User ID/PIN enrolled on ZKTeco device
    name: string;
    department: string;
    isActive: boolean;
    enrolledAt: Date;
}

const customerSchema: Schema<ICustomer> = new Schema({
    deviceId: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    enrolledAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICustomer>('Customer', customerSchema);
