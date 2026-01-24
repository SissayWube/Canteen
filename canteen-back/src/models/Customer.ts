// src/models/Customer.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    deviceId: string;      // Must match the User ID/PIN enrolled on ZKTeco device
    name: string;
    department: string;
    isActive: boolean;
    enrolledAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

const customerSchema: Schema<ICustomer> = new Schema({
    deviceId: { type: String, required: true, trim: true }, // Unique index defined below
    name: { type: String, required: true },
    department: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    enrolledAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

// Soft delete middleware
// Soft delete middleware
customerSchema.pre(/^find/, function (this: mongoose.Query<any, any>) {
    const query = this.getQuery();
    if (query.deletedAt === undefined) {
        this.where({ deletedAt: null });
    }
});

// Unique index only for non-deleted customers
customerSchema.index({ deviceId: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export default mongoose.model<ICustomer>('Customer', customerSchema);
