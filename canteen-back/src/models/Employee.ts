import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    deviceId: string;
    name: string;
    department?: string;
    balance: number;
    isActive: boolean;
    enrolledAt: Date;
}

const employeeSchema: Schema = new Schema({
    deviceId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    department: String,
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    enrolledAt: { type: Date, default: Date.now },
});

export default mongoose.model<IEmployee>('Employee', employeeSchema);