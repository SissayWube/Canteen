import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { SECURITY } from '../constants/index.js';

export default function getSessionMiddleware(mongooseConnection: typeof mongoose) {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in .env');
  }
  return session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-this',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongooseConnection.connection.getClient() as any,
      collectionName: 'sessions',
      ttl: SECURITY.SESSION_TTL_SECONDS,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'false' ? false : process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SECURITY.SESSION_TTL_MS,
    },
  });
}