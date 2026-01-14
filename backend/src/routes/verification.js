import express from 'express';
import db from '../db/database.js';

const router = express.Router();

/**
 * GET /api/verification/checkouts
 * Get checkouts grouped by session with their items
 */
router.get('/checkouts', (req, res, next) => {
  try {
    const { status = 'pending', limit = 50, lastMonthOnly = false } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE c.verification_status = ?';
    const params = [status];

    if (lastMonthOnly === 'true' && status === 'approved') {
      whereClause += ` AND c.date >= datetime('now', '-30 days')`;
    }

    // Get checkouts
    const checkoutsQuery = `
      SELECT
        c.id,
        c.date,
        c.owner_name,
        c.email,
        c.housing_assignment,
        c.graduation_year,
        c.verification_status,
        c.verified_at,
        c.verified_by
      FROM checkouts c
      ${whereClause}
      ORDER BY c.date DESC
      LIMIT ?
    `;

    const checkouts = db.prepare(checkoutsQuery).all(...params, parseInt(limit));

    // Get items for each checkout
    const checkoutsWithItems = checkouts.map(checkout => {
      const itemsQuery = `
        SELECT
          id,
          item_name,
          item_quantity,
          description,
          image_url,
          verification_status,
          verified_at
        FROM checkout_items
        WHERE checkout_id = ?
        ORDER BY id
      `;

      const items = db.prepare(itemsQuery).all(checkout.id);

      return {
        ...checkout,
        items
      };
    });

    // Get statistics
    const stats = {
      pending: db.prepare('SELECT COUNT(*) as count FROM checkouts WHERE verification_status = ?').get('pending').count,
      approved: db.prepare(`SELECT COUNT(*) as count FROM checkouts WHERE verification_status = ? AND date >= datetime('now', '-30 days')`).get('approved').count,
      flagged: db.prepare('SELECT COUNT(*) as count FROM checkouts WHERE verification_status = ?').get('flagged').count
    };

    res.json({
      checkouts: checkoutsWithItems,
      stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/verification/items
 * Get individual items for verification (legacy support)
 */
router.get('/items', (req, res, next) => {
  try {
    const { status = 'pending', limit = 50 } = req.query;

    const itemsQuery = `
      SELECT
        ci.id,
        ci.checkout_id,
        ci.item_name,
        ci.item_quantity,
        ci.description,
        ci.image_url,
        ci.verification_status,
        ci.verified_at,
        c.owner_name as donor_name,
        c.email as donor_email,
        c.date
      FROM checkout_items ci
      JOIN checkouts c ON ci.checkout_id = c.id
      WHERE ci.verification_status = ?
      ORDER BY c.date DESC
      LIMIT ?
    `;

    const items = db.prepare(itemsQuery).all(status, parseInt(limit));

    // Get statistics
    const stats = {
      pending: db.prepare('SELECT COUNT(*) as count FROM checkout_items WHERE verification_status = ?').get('pending').count,
      approved: db.prepare('SELECT COUNT(*) as count FROM checkout_items WHERE verification_status = ?').get('approved').count,
      flagged: db.prepare('SELECT COUNT(*) as count FROM checkout_items WHERE verification_status = ?').get('flagged').count
    };

    res.json({
      items,
      stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/verification/checkouts/:id
 * Update verification status for all items in a checkout session
 */
router.patch('/checkouts/:id', (req, res, next) => {
  try {
    const checkoutId = parseInt(req.params.id);
    const { status, verifiedBy, verifiedAt } = req.body;

    if (!['pending', 'approved', 'flagged'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update checkout status
    const updateCheckoutQuery = `
      UPDATE checkouts
      SET verification_status = ?,
          verified_at = ?,
          verified_by = ?
      WHERE id = ?
    `;

    db.prepare(updateCheckoutQuery).run(
      status,
      verifiedAt || new Date().toISOString(),
      verifiedBy || 'system',
      checkoutId
    );

    // Update all items in the checkout
    const updateItemsQuery = `
      UPDATE checkout_items
      SET verification_status = ?,
          verified_at = ?,
          verified_by = ?
      WHERE checkout_id = ?
    `;

    db.prepare(updateItemsQuery).run(
      status,
      verifiedAt || new Date().toISOString(),
      verifiedBy || 'system',
      checkoutId
    );

    res.json({
      success: true,
      message: `Checkout ${checkoutId} and all its items updated to ${status}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/verification/items/:id
 * Update verification status for a single item
 */
router.patch('/items/:id', (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id);
    const { status, verifiedBy, verifiedAt } = req.body;

    if (!['pending', 'approved', 'flagged'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateQuery = `
      UPDATE checkout_items
      SET verification_status = ?,
          verified_at = ?,
          verified_by = ?
      WHERE id = ?
    `;

    db.prepare(updateQuery).run(
      status,
      verifiedAt || new Date().toISOString(),
      verifiedBy || 'system',
      itemId
    );

    res.json({
      success: true,
      message: `Item ${itemId} updated to ${status}`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
