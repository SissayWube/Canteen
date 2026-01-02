import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  employeeId: mongoose.Types.ObjectId;
  deviceUserId: string;
  workCode: string;
  timestamp: Date;
  status: 'success' | 'failed';
  ticketPrinted: boolean;
}

const transactionSchema: Schema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  deviceUserId: String,
  workCode: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  ticketPrinted: Boolean,
});

export default mongoose.model<ITransaction>('Transaction', transactionSchema);