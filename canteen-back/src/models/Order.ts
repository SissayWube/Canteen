import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  employee: mongoose.Types.ObjectId;     // Ref to Employee
  foodItem: mongoose.Types.ObjectId;    // Ref to FoodItem (optional if code not found)
  price: number;                       // Full price at time of transaction
  subsidy: number;                     // Subsidy at time of transaction
  currency: string;                     // Currency at time of transaction
  workCode: string;                      // Raw code from device (for fallback/audit)
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  type: 'manual' | 'automatic';
  ticketPrinted: boolean;
  operator?: mongoose.Types.ObjectId;  // Ref to User (who issued/approved)
}

const orderSchema: Schema<IOrder> = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  foodItem: { type: Schema.Types.ObjectId, ref: 'FoodItem' },
  price: { type: Number, required: true },
  subsidy: { type: Number, default: 0 },
  currency: { type: String, default: 'ETB' },
  workCode: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  type: { type: String, enum: ['manual', 'automatic'], default: 'manual' },
  ticketPrinted: { type: Boolean, default: false },
  operator: { type: Schema.Types.ObjectId, ref: 'User' },
});

// Compound index for common queries (reports)
orderSchema.index({ employee: 1, timestamp: -1 });
orderSchema.index({ timestamp: -1 });

export default mongoose.model<IOrder>('Order', orderSchema);