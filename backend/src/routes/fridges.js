import express from 'express';
import { z } from 'zod';
import db from '../db/database.js';

const router = express.Router();

// Validation schemas
const createFridgeSchema = z.object({
  fridgeNumber: z.string().min(1).max(20),
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  size: z.enum(['Mini', 'Compact', 'Standard']).optional(),
  condition: z.enum(['Good', 'Fair', 'Needs Repair']).default('Good'),
  notes: z.string().max(500).optional()
});

const checkoutFridgeSchema = z.object({
  fridgeId: z.number(),
  studentName: z.string().min(1).max(100),
  studentEmail: z.string().email(),
  studentId: z.string().max(20).optional(),
  housingAssignment: z.string().min(1).max(100),
  phoneNumber: z.string().max(20).optional(),
  expectedReturnDate: z.string(), // ISO date string
  conditionAtCheckout: z.enum(['Good', 'Fair', 'Needs Repair']),
  notesCheckout: z.string().max(500).optional(),
  checkedOutBy: z.string().max(100).optional()
});

const checkinFridgeSchema = z.object({
  conditionAtReturn: z.enum(['Good', 'Fair', 'Needs Repair', 'Damaged', 'Lost']),
  notesReturn: z.string().max(500).optional(),
  checkedInBy: z.string().max(100).optional()
});

/**
 * GET /api/fridges
 * Get all fridges with optional status filter
 */
router.get('/', (req, res, next) => {
  try {
    const { status } = req.query;

    let query = 'SELECT * FROM fridges';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY fridge_number';

    const fridges = db.prepare(query).all(...params);

    res.json({ fridges });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fridges/stats
 * Get fridge inventory statistics
 */
router.get('/stats', (req, res, next) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM fridges').get().count,
      available: db.prepare('SELECT COUNT(*) as count FROM fridges WHERE status = ?').get('available').count,
      checkedOut: db.prepare('SELECT COUNT(*) as count FROM fridges WHERE status = ?').get('checked_out').count,
      maintenance: db.prepare('SELECT COUNT(*) as count FROM fridges WHERE status = ?').get('maintenance').count,
      overdue: db.prepare(`
        SELECT COUNT(*) as count FROM fridge_checkouts
        WHERE status = 'active'
        AND expected_return_date < date('now')
      `).get().count
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fridges/:id
 * Get single fridge with checkout history
 */
router.get('/:id', (req, res, next) => {
  try {
    const fridgeId = parseInt(req.params.id);

    const fridge = db.prepare('SELECT * FROM fridges WHERE id = ?').get(fridgeId);

    if (!fridge) {
      return res.status(404).json({ error: 'Fridge not found' });
    }

    // Get checkout history
    const checkouts = db.prepare(`
      SELECT * FROM fridge_checkouts
      WHERE fridge_id = ?
      ORDER BY checkout_date DESC
    `).all(fridgeId);

    // Get maintenance history
    const maintenance = db.prepare(`
      SELECT * FROM fridge_maintenance
      WHERE fridge_id = ?
      ORDER BY maintenance_date DESC
    `).all(fridgeId);

    res.json({
      fridge,
      checkouts,
      maintenance
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/fridges
 * Add new fridge to inventory
 */
router.post('/', (req, res, next) => {
  try {
    const validationResult = createFridgeSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    const result = db.prepare(`
      INSERT INTO fridges (fridge_number, brand, model, size, condition, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.fridgeNumber,
      data.brand || null,
      data.model || null,
      data.size || null,
      data.condition,
      data.notes || null
    );

    const fridge = db.prepare('SELECT * FROM fridges WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(fridge);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Fridge number already exists' });
    }
    next(error);
  }
});

/**
 * GET /api/fridges/checkouts/active
 * Get all active checkouts (not returned)
 */
router.get('/checkouts/active', (req, res, next) => {
  try {
    const checkouts = db.prepare(`
      SELECT
        fc.*,
        f.fridge_number,
        f.brand,
        f.model,
        f.size,
        CASE
          WHEN fc.expected_return_date < date('now') THEN 'overdue'
          ELSE 'active'
        END as computed_status
      FROM fridge_checkouts fc
      JOIN fridges f ON fc.fridge_id = f.id
      WHERE fc.actual_return_date IS NULL
      ORDER BY fc.expected_return_date ASC
    `).all();

    res.json({ checkouts });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/fridges/checkout
 * Check out a fridge to a student
 */
router.post('/checkout', (req, res, next) => {
  try {
    const validationResult = checkoutFridgeSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Check if fridge exists and is available
    const fridge = db.prepare('SELECT * FROM fridges WHERE id = ? AND status = ?')
      .get(data.fridgeId, 'available');

    if (!fridge) {
      return res.status(400).json({
        error: 'Fridge not available for checkout'
      });
    }

    // Create checkout record
    const checkoutResult = db.prepare(`
      INSERT INTO fridge_checkouts (
        fridge_id, student_name, student_email, student_id,
        housing_assignment, phone_number, expected_return_date,
        condition_at_checkout, notes_checkout, checked_out_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      data.fridgeId,
      data.studentName,
      data.studentEmail,
      data.studentId || null,
      data.housingAssignment,
      data.phoneNumber || null,
      data.expectedReturnDate,
      data.conditionAtCheckout,
      data.notesCheckout || null,
      data.checkedOutBy || 'system'
    );

    // Update fridge status
    db.prepare('UPDATE fridges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('checked_out', data.fridgeId);

    const checkout = db.prepare('SELECT * FROM fridge_checkouts WHERE id = ?')
      .get(checkoutResult.lastInsertRowid);

    res.status(201).json(checkout);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/fridges/checkout/:id/return
 * Check in a returned fridge
 */
router.patch('/checkout/:id/return', (req, res, next) => {
  try {
    const checkoutId = parseInt(req.params.id);

    const validationResult = checkinFridgeSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Get checkout record
    const checkout = db.prepare(`
      SELECT * FROM fridge_checkouts WHERE id = ? AND actual_return_date IS NULL
    `).get(checkoutId);

    if (!checkout) {
      return res.status(404).json({ error: 'Active checkout not found' });
    }

    // Update checkout record
    db.prepare(`
      UPDATE fridge_checkouts
      SET actual_return_date = CURRENT_TIMESTAMP,
          condition_at_return = ?,
          notes_return = ?,
          checked_in_by = ?,
          status = 'returned',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.conditionAtReturn,
      data.notesReturn || null,
      data.checkedInBy || 'system',
      checkoutId
    );

    // Update fridge status and condition
    const newFridgeStatus = data.conditionAtReturn === 'Needs Repair' || data.conditionAtReturn === 'Damaged'
      ? 'maintenance'
      : 'available';

    const newCondition = data.conditionAtReturn === 'Lost'
      ? 'Needs Repair'
      : data.conditionAtReturn;

    db.prepare(`
      UPDATE fridges
      SET status = ?,
          condition = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newFridgeStatus, newCondition, checkout.fridge_id);

    const updatedCheckout = db.prepare('SELECT * FROM fridge_checkouts WHERE id = ?')
      .get(checkoutId);

    res.json(updatedCheckout);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/fridges/:id
 * Update fridge information
 */
router.patch('/:id', (req, res, next) => {
  try {
    const fridgeId = parseInt(req.params.id);
    const { brand, model, size, condition, status, notes } = req.body;

    const updates = [];
    const values = [];

    if (brand !== undefined) {
      updates.push('brand = ?');
      values.push(brand);
    }
    if (model !== undefined) {
      updates.push('model = ?');
      values.push(model);
    }
    if (size !== undefined) {
      updates.push('size = ?');
      values.push(size);
    }
    if (condition !== undefined) {
      updates.push('condition = ?');
      values.push(condition);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(fridgeId);

    db.prepare(`UPDATE fridges SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const fridge = db.prepare('SELECT * FROM fridges WHERE id = ?').get(fridgeId);

    res.json(fridge);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/fridges/:id
 * Remove fridge from inventory (only if never checked out)
 */
router.delete('/:id', (req, res, next) => {
  try {
    const fridgeId = parseInt(req.params.id);

    // Check if fridge has checkout history
    const hasHistory = db.prepare('SELECT COUNT(*) as count FROM fridge_checkouts WHERE fridge_id = ?')
      .get(fridgeId).count > 0;

    if (hasHistory) {
      return res.status(400).json({
        error: 'Cannot delete fridge with checkout history. Consider marking as retired instead.'
      });
    }

    db.prepare('DELETE FROM fridges WHERE id = ?').run(fridgeId);

    res.json({ message: 'Fridge deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
