import express, { Request, Response } from 'express';
import FoodItem from '../models/FoodItem';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// All routes require admin login
router.use(requireAuth);

// GET all food items
router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await FoodItem.find().sort({ name: 1 });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new
router.post('/', async (req: Request, res: Response) => {
  try {
    const item = await FoodItem.create(req.body);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const item = await FoodItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: 'Food item not found' });
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await FoodItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Food item not found' });
    res.json({ message: 'Food item deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;