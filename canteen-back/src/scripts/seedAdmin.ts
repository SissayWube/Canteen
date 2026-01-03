// src/scripts/seedAdmin.ts
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import connectDB from '../config/db';
import Settings from '../models/Settings';

dotenv.config();

const seedAdmin = async () => {
  await connectDB();

  const username = 'admin';
  const password = 'admin123'; // CHANGE THIS AFTER FIRST LOGIN!

  try {
    await Settings.findOneAndUpdate(
      {},
      { dailyMealLimit: 3, companyName: 'XYZ Company Canteen' },
      { upsert: true }
    );
    const existing = await User.findOne({ username });
    if (existing) {
      console.log('Admin user already exists');
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    await User.create({
      username,
      password: hashed,
      role: 'admin' as const,
      fullName: 'System Administrator',
    });

    console.log('Initial admin created:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }



};

seedAdmin();