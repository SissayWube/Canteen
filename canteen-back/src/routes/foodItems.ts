import express, { Request, Response } from 'express';
import FoodItem from '../models/FoodItem';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// All routes require admin login
router.use(requireAuth);

// GET all food items with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      isActive,
    } = req.query;

    const query: any = {};

    // Search by name or code
    if (search && typeof search === 'string' && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Filter by active status
    if (isActive !== undefined && typeof isActive === 'string') {
      query.isActive = isActive === 'true';
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const foodItems = await FoodItem.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await FoodItem.countDocuments(query);

    res.json({
      foodItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
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
// DELETE (Soft Delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await FoodItem.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date(), isActive: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Food item not found' });
    res.json({ message: 'Food item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;