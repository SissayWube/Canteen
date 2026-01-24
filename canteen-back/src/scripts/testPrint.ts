import { printTicket } from '../services/printerService';

async function test() {
  const success = await printTicket({
    companyName: 'Test Canteen',
    customerName: 'John Doe',
    customerId: 'EMP001',
    mealName: 'Veg Lunch',
    timestamp: new Date(),
    orderId: 'TEST123',
  });
  console.log('Test print result:', success);
  process.exit();
}

test();