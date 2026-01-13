import express from 'express';
import { z } from 'zod';
import { donorService } from '../services/donorService.js';

const router = express.Router();

// Validation schemas
const createDonorSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  housing: z.string().max(100).optional(),
  gradYear: z.string().regex(/^\d{4}$/).optional()
});

/**
 * GET /api/donors/search?q={query}
 * Search donors by name or email
 */
router.get('/search', (req, res, next) => {
  try {
    const query = req.query.q || '';
    const donors = donorService.searchDonors(query);

    res.json(donors);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/donors/:id
 * Get donor by ID
 */
router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid donor ID' });
    }

    const donor = donorService.getDonorById(id);

    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    res.json(donor);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/donors
 * Create new donor
 */
router.post('/', (req, res, next) => {
  try {
    // Validate request body
    const validationResult = createDonorSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const donorData = validationResult.data;

    // Check if donor already exists
    const existing = donorService.getDonorByEmail(donorData.email);

    if (existing) {
      return res.status(409).json({
        error: 'Donor with this email already exists',
        donor: existing
      });
    }

    // Create new donor
    const donor = donorService.createDonor(donorData);

    res.status(201).json(donor);
  } catch (error) {
    next(error);
  }
});

export default router;
