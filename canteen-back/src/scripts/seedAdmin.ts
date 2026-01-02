import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.ts';
import connectDB from '../config/db.ts';

dotenv.config();

const seedAdmin = async () => {
  await connectDB();

  const username = 'admin';
  const password = 'admin123'; // Change this immediately after first login!

  try {
    const existing = await Admin.findOne({ username });
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await Admin.create({ username, password: hashedPassword });

    console.log('Initial admin created:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('👆 Change this password immediately after first login!');
  } catch (error: any) {
    console.error('Error seeding admin:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();