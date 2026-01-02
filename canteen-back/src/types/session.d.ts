import { IAdmin } from '../models/Admin';

declare module 'express-session' {
    interface SessionData {
        adminId: string;
        username: string;
    }
}