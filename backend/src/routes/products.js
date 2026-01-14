import express from 'express';
import { z } from 'zod';
import { productService } from '../services/productService.js';

const router = express.Router();

// Validation schema for creating products
const createProductSchema = z.object({
  // Option 1: Use existing donor ID
  donorId: z.number().optional(),
  // Option 2: Provide donor details (will find or create)
  donorName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  housing: z.string().max(100).optional(),
  gradYear: z.string().regex(/^\d{4}$/).optional(),

  // Option 1: Use existing category ID
  categoryId: z.number().optional(),
  // Option 2: Provide category name (will find or create)
  categoryName: z.string().min(1).max(100).optional(),

  // Required fields
  description: z.string().min(10).max(500),
  photoUrl: z.string().url().optional(),
  createdBy: z.string().optional()
}).refine(
  (data) => data.donorId || (data.donorName && data.email),
  {
    message: 'Either donorId or (donorName + email) must be provided'
  }
).refine(
  (data) => data.categoryId || data.categoryName,
  {
    message: 'Either categoryId or categoryName must be provided'
  }
);

/**
 * GET /api/products
 * Get all products (paginated)
 */
router.get('/', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const products = productService.getAllProducts(limit, offset);

    res.json(products);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = productService.getProductById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products
 * Create new product (with automatic donor/category creation if needed)
 */
router.post('/', (req, res, next) => {
  try {
    // Validate request body
    const validationResult = createProductSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const productData = validationResult.data;

    // Create product (will handle donor/category creation)
    const product = productService.createProduct(productData);

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
