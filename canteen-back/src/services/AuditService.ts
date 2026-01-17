import { AuditLog } from '../models/AuditLog';
import { Request } from 'express';

interface LogOptions {
    req?: Request;
    userId?: string;
    username?: string;
}

export class AuditService {
    static async log(
        action: string,
        details: any = {},
        options: LogOptions = {},
        subModel: string = '',
        subId: string = ''
    ) {
        try {
            // Extract user info from request if available, otherwise from options
            let userId = options.userId;
            let username = options.username;
            let ipAddress = options.req?.ip || '';

            if (options.req && (options.req as any).user) {
                const user = (options.req as any).user;
                if (!userId) userId = user._id || user.userId;
                if (!username) username = user.username;
            }

            if (!userId || !username) {
                // System action or anonymous? Default to 'System' or handle accordingly
                // For now, if we can't identify user, we might skip or log as 'System' depending on requirement.
                // But let's assume most critical actions are authenticated.
                if (!username) username = 'System'; // Fallback
            }

            // Create log entry (fire and forget, don't await if performance is critical, but await for safety)
            await AuditLog.create({
                action,
                subModel,
                subId,
                performedBy: userId, // Assuming ObjectId is valid, otherwise might need check
                performedByUsername: username,
                details,
                ipAddress
            });
            console.log(`[Audit] ${action} by ${username}`);
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw error to prevent blocking main flow
        }
    }
}
