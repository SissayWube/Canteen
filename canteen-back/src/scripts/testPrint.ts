import dotenv from 'dotenv';
dotenv.config();
import { printTicket } from '../services/printerService';

async function test() {
  const success = await printTicket({
    companyName: 'XYZ Company Canteen',
    customerName: 'Animut Leyikun',
    customerId: '3',
    department: 'Engineering',
    mealName: 'Aynet',
    mealCode: 'AY-01',
    price: 120,
    subsidy: 20,
    currency: 'ETB',
    timestamp: new Date(),
    orderId: 'TEST1234',
    operatorName: 'admin',
  });
  console.log('Test print result:', success);
  process.exit();
}

test();