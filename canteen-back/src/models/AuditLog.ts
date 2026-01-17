import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
    action: string;
    subModel: string;
    subId: string;
    performedBy: mongoose.Types.ObjectId;
    performedByUsername: string; // Cache username in case user is deleted
    details: any;
    ipAddress?: string;
    timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
    action: { type: String, required: true },
    subModel: { type: String, required: false }, // e.g., 'Order', 'User', 'Settings'
    subId: { type: String, required: false },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByUsername: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
});

// Index for faster queries
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ performedBy: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
