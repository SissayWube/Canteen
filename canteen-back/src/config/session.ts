import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';


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
      ttl: 1 * 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 24 * 60 * 60 * 1000,
    },
  });



  // export default session({
  //   secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-prod',
  //   resave: false,
  //   saveUninitialized: false,
  //   store: MongoStore.create({
  //     mongoUrl: process.env.MONGODB_URI!,
  //     collectionName: 'sessions',
  //     ttl: 7 * 24 * 60 * 60,
  //   }),
  //   cookie: {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'lax',
  //     maxAge: 7 * 24 * 60 * 60 * 1000,
  //   },
  // });
};