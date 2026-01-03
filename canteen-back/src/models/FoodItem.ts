import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodItem extends Document {
    code: string;         // The "work code" number sent by ZKTeco device (e.g., "1", "2")
    name: string;         // Display name (e.g., "Veg Lunch")
    description?: string;
    price: number;        // Full price (for reporting/subtraction)
    subsidy: number;     //  subsidized amount (e.g., company pays part)
    currency?: string;    // Currency code ETB by default
    isActive: boolean;    // Enable/disable this item
    availableDays?: string[]; // e.g., ['Monday', 'Tuesday', ...] or leave empty for all days
    createdAt: Date;
    updatedAt: Date;
}

const foodItemSchema: Schema<IFoodItem> = new Schema({
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    subsidy: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'ETB' },
    isActive: { type: Boolean, default: true },
    availableDays: [String], // e.g., ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
});

// Index for faster lookups by code (most common query from device)
foodItemSchema.index({ code: 1, isActive: 1 });

export default mongoose.model<IFoodItem>('FoodItem', foodItemSchema);