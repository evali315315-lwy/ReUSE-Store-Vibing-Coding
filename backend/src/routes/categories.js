import express from 'express';
import { z } from 'zod';
import { categoryService } from '../services/categoryService.js';

const router = express.Router();

// Validation schema
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  createdBy: z.string().optional()
});

/**
 * GET /api/categories
 * Get all categories sorted by usage
 */
router.get('/', (req, res, next) => {
  try {
    const categories = categoryService.getAllCategories();

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories/:id
 * Get category by ID
 */
router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const category = categoryService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/categories
 * Create new category
 */
router.post('/', (req, res, next) => {
  try {
    // Validate request body
    const validationResult = createCategorySchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { name, createdBy } = validationResult.data;

    // Check if category already exists (case-insensitive)
    const existing = categoryService.getCategoryByName(name);

    if (existing) {
      return res.status(409).json({
        error: 'Category already exists',
        category: existing
      });
    }

    // Create new category
    const category = categoryService.createCategory(name, createdBy);

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

export default router;
