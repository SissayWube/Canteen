import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { SECURITY } from '../constants';


export default function getSessionMiddleware(mongooseConnection: typeof mongoose) {
  if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
    throw new Error('Missing required env vars for session');
  }

  return session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-prod',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI!,
      collectionName: 'sessions',
      ttl: SECURITY.SESSION_TTL_SECONDS,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SECURITY.SESSION_TTL_MS,
    },
  });
};
