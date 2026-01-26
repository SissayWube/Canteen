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
  deletedAt?: Date;
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
  deletedAt: { type: Date, default: null },
}, {
  timestamps: true // Add createdAt/updatedAt
});

// Soft delete middleware
orderSchema.pre(/^find/, function (this: mongoose.Query<any, any>) {
  const query = this.getQuery();
  if (query.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

// Compound indexes for optimized query performance
orderSchema.index({ customer: 1, timestamp: -1 }); // Customer order history
orderSchema.index({ timestamp: -1 }); // Recent orders (dashboard)
orderSchema.index({ status: 1, timestamp: -1 }); // Filter by status + date (Analysis page)
orderSchema.index({ timestamp: -1, status: 1 }); // Reverse order for date range + status filters
orderSchema.index({ customer: 1, foodItem: 1, timestamp: -1 }); // Detailed customer-food analysis
orderSchema.index({ operator: 1, timestamp: -1 }); // Operator performance reports
// New indexes for better query performance
orderSchema.index({ isGuest: 1, timestamp: -1 }); // Guest order filtering
orderSchema.index({ guestName: 'text' }); // Text search for guest names
orderSchema.index({ deletedAt: 1, timestamp: -1, status: 1 }); // Dashboard soft delete queries

export default mongoose.model<IOrder>('Order', orderSchema);