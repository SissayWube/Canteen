import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  employee: mongoose.Types.ObjectId;     // Ref to Employee
  foodItem?: mongoose.Types.ObjectId;    // Ref to FoodItem (optional if code not found)
  price: number;                       // Full price at time of transaction
  subsidy: number;                     // Subsidy at time of transaction
  currency: string;                     // Currency at time of transaction
  workCode: string;                      // Raw code from device (for fallback/audit)
  timestamp: Date;
  status: 'success' | 'failed';
  ticketPrinted: boolean;
  amountDeducted?: number;               // Final amount deducted from balance
}

const transactionSchema: Schema<ITransaction> = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  foodItem: { type: Schema.Types.ObjectId, ref: 'FoodItem' },
  workCode: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  ticketPrinted: { type: Boolean, default: false },
  amountDeducted: Number,
});

// Compound index for common queries (reports)
transactionSchema.index({ employee: 1, timestamp: -1 });
transactionSchema.index({ timestamp: -1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);