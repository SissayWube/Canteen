import dotenv from 'dotenv';
import Customer from '../models/Customer';
import connectDB from '../config/db';

dotenv.config();

const seedCustomers = async () => {
    await connectDB();

    const testCustomers = [
        { deviceId: '1001', name: 'Alice Johnson', department: 'Engineering', balance: 150 },
        { deviceId: '1002', name: 'Bob Smith', department: 'HR', balance: 120 },
        { deviceId: '1003', name: 'Carol Lee', department: 'Sales', balance: 100 },
    ];

    try {
        await Customer.deleteMany({});
        await Customer.insertMany(testCustomers);
        console.log('Test customers seeded');
    } catch (error: any) {
        console.error('Error:', error.message);
    } finally {
        process.exit();
    }
};

seedCustomers();
