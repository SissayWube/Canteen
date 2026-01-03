import { printTicket } from '../services/printerService';

async function test() {
  const success = await printTicket({
    companyName: 'Test Canteen',
    employeeName: 'John Doe',
    mealName: 'Veg Lunch',
    timestamp: new Date(),
    transactionId: 'TEST123',
  });
  console.log('Test print result:', success);
  process.exit();
}

test();