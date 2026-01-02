import express, { Request, Response } from 'express';
import Employee from '../models/Employee.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (_req: Request, res: Response) => {
  const employees = await Employee.find();
  res.json(employees);
});

router.post('/', async (req: Request, res: Response) => {
  const employee = await Employee.create(req.body);
  res.status(201).json(employee);
});

export default router;