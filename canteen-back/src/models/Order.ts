import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  customer: mongoose.Types.ObjectId;     // Ref to Customer
  foodItem: mongoose.Types.ObjectId;    // Ref to FoodItem (optional if code not found)
  price: number;                       // Full price at time of transaction
  subsidy: number;                     // Subsidy at time of transaction
  currency: string;                     // Currency at time of transaction
  workCode: string;                      // Raw code from device (for fallback/audit)
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  type: 'manual' | 'automatic';
  ticketPrinted: boolean;
  isGuest: boolean;
  guestName: string;
  notes: string;
  operator?: mongoose.Types.ObjectId;  // Ref to User (who issued/approved)
}

const orderSchema: Schema<IOrder> = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: function (this: IOrder) { return !this.isGuest; }
  },
  foodItem: { type: Schema.Types.ObjectId, ref: 'FoodItem' },
  price: { type: Number, required: true },
  subsidy: { type: Number, default: 0 },
  currency: { type: String, default: 'ETB' },
  workCode: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  type: { type: String, enum: ['manual', 'automatic'], default: 'manual' },
  ticketPrinted: { type: Boolean, default: false },
  isGuest: { type: Boolean, default: false },
  guestName: { type: String, default: '' },
  notes: { type: String, default: '' },
  operator: { type: Schema.Types.ObjectId, ref: 'User' },
});

// Compound index for common queries (reports)
orderSchema.index({ customer: 1, timestamp: -1 });
orderSchema.index({ timestamp: -1 });

export default mongoose.model<IOrder>('Order', orderSchema);