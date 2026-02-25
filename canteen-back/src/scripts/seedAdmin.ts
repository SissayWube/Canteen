// src/scripts/seedAdmin.ts
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import connectDB from '../config/db.js';
import Settings from '../models/Settings.js';

dotenv.config();

export const seedAdmin = async () => {
  try {
    const username = 'admin';
    const password = 'admin123'; // CHANGE THIS AFTER FIRST LOGIN!

    await Settings.findOneAndUpdate(
      {},
      { dailyMealLimit: 3, companyName: 'Phibela Industrial PLC Canteen' },
      { upsert: true }
    );
    const existing = await User.findOne({ username });
    if (existing) {
      console.log('Admin user already exists, skipping seed.');
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
    console.error('Seed error:', error.message);
  }
};

// Allow running standalone: npx tsx src/scripts/seedAdmin.ts
const isMain = process.argv[1]?.includes('seedAdmin');
if (isMain) {
  connectDB().then(() => seedAdmin()).then(() => process.exit(0));
}