import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const departmentSchema: Schema<IDepartment> = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
}, {
    timestamps: true,
});

export default mongoose.model<IDepartment>('Department', departmentSchema);
