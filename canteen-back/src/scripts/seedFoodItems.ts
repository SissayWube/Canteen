import dotenv from 'dotenv';
import FoodItem from '../models/FoodItem';
import connectDB from '../config/db';
import type { IFoodItem } from '../models/FoodItem';

dotenv.config();

const mealsToSeed: Partial<IFoodItem>[] = [
  {
    code: '1',
    name: 'Standard Lunch',
    description: 'Includes injera, wot, and vegetable side dish.',
    price: 100,
    subsidy: 80,
    currency: 'ETB',
    isActive: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  {
    code: '2',
    name: 'Special Lunch (Fish/Doro)',
    description: 'Includes injera, wot, and vegetable side dish.',
    price: 150,
    subsidy: 120,
    currency: 'ETB',
    isActive: true,
    availableDays: ['Wednesday', 'Friday'],
  },
  {
    code: '3',
    name: 'Breakfast',
    description: 'Includes injera, wot, and vegetable side dish.',
    price: 50,
    subsidy: 50,
    currency: 'ETB',
    isActive: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  {
    code: '4',
    name: 'Snack/Tea',
    description: 'Includes injera, wot, and vegetable side dish.',
    price: 25,
    subsidy: 25,
    currency: 'ETB',
    isActive: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  {
    code: '5',
    name: 'Guest Meal',
    description: 'Includes injera, wot, and vegetable side dish.',
    price: 200,
    subsidy: 0,
    currency: 'ETB',
    isActive: true,
  },
];

const seedMeals = async () => {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected.');

  try {
    console.log('Seeding meal items...');
    for (const meal of mealsToSeed) {
      const result = await FoodItem.findOneAndUpdate(
        { code: meal.code },
        meal,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`- Upserted '${result.name}' (Code: ${result.code})`);
    }
    console.log('✅ Meal seeding complete!');
  } catch (error: any) {
    console.error('❌ Error during meal seeding:', error.message);
  } finally {
    console.log('Closing database connection.');
    process.exit();
  }
};

seedMeals();
