import dotenv from 'dotenv';
import Employee from '../models/Employee';
import connectDB from '../config/db';

dotenv.config();

const seedEmployees = async () => {
    await connectDB();

    const testEmployees = [
        { deviceId: '1001', name: 'Alice Johnson', department: 'Engineering', balance: 150 },
        { deviceId: '1002', name: 'Bob Smith', department: 'HR', balance: 120 },
        { deviceId: '1003', name: 'Carol Lee', department: 'Sales', balance: 100 },
    ];

    try {
        await Employee.deleteMany({});
        await Employee.insertMany(testEmployees);
        console.log('Test employees seeded');
    } catch (error: any) {
        console.error('Error:', error.message);
    } finally {
        process.exit();
    }
};

seedEmployees();