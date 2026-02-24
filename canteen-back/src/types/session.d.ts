import { IUser } from '../models/User.js';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    username: string;
    role: 'admin' | 'operator';
  }
}