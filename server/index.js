import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Database path
const DB_PATH = path.join(__dirname, '../database/reuse-store.db');
const db = new Database(DB_PATH, { readonly: false });

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ReUSE Store API is running' });
});

// Get all year ranges
app.get('/api/years', (req, res) => {
  try {
    const years = db.prepare(`
      SELECT DISTINCT year_range
      FROM checkouts
      ORDER BY year_range
    `).all();

    res.json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: 'Failed to fetch years' });
  }
});

// Get statistics
app.get('/api/statistics', (req, res) => {
  try {
    const { year } = req.query;

    let query = `
      SELECT
        COUNT(*) as total_checkouts,
        (SELECT COUNT(*) FROM items ${year ? 'WHERE year_range = ?' : ''}) as total_items,
        (SELECT COUNT(*) FROM items WHERE verification_status = 'pending' ${year ? 'AND year_range = ?' : ''}) as pending_items,
        (SELECT COUNT(*) FROM items WHERE verification_status = 'checked' ${year ? 'AND year_range = ?' : ''}) as checked_items,
        (SELECT COUNT(*) FROM items WHERE flagged = 1 ${year ? 'AND year_range = ?' : ''}) as flagged_items
      FROM checkouts
      ${year ? 'WHERE year_range = ?' : ''}
    `;

    const params = year ? [year, year, year, year, year] : [];
    const stats = db.prepare(query).get(...params);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get checkouts with pagination
app.get('/api/checkouts', (req, res) => {
  try {
    const { year, page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = [];
    let params = [];

    if (year) {
      whereClause.push('year_range = ?');
      params.push(year);
    }

    if (search) {
      whereClause.push('(owner_name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM checkouts ${where}`;
    const { count } = db.prepare(countQuery).get(...params);

    // Get paginated results
    const query = `
      SELECT *
      FROM checkouts
      ${where}
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `;

    const checkouts = db.prepare(query).all(...params, limit, offset);

    res.json({
      checkouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching checkouts:', error);
    res.status(500).json({ error: 'Failed to fetch checkouts' });
  }
});

// Get items for verification with pagination
app.get('/api/verification/items', (req, res) => {
  try {
    const { year, status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = ['verification_status = ?'];
    let params = [status];

    if (year) {
      whereClause.push('year_range = ?');
      params.push(year);
    }

    const where = whereClause.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM items WHERE ${where}`;
    const { count } = db.prepare(countQuery).get(...params);

    // Get items with checkout details
    const query = `
      SELECT
        items.*,
        checkouts.owner_name,
        checkouts.email,
        checkouts.date,
        checkouts.housing_assignment,
        checkouts.graduation_year
      FROM items
      JOIN checkouts ON items.checkout_id = checkouts.id
      WHERE ${where}
      ORDER BY items.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const items = db.prepare(query).all(...params, limit, offset);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching verification items:', error);
    res.status(500).json({ error: 'Failed to fetch verification items' });
  }
});

// Update item verification status
app.patch('/api/verification/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { verification_status, flagged, verified_by, image_url } = req.body;

    const updates = [];
    const params = [];

    if (verification_status) {
      updates.push('verification_status = ?');
      params.push(verification_status);
    }

    if (flagged !== undefined) {
      updates.push('flagged = ?');
      params.push(flagged ? 1 : 0);
    }

    if (verified_by) {
      updates.push('verified_by = ?');
      params.push(verified_by);
    }

    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }

    if (verification_status === 'checked' || verification_status === 'flagged') {
      updates.push('verified_at = CURRENT_TIMESTAMP');
    }

    params.push(id);

    const query = `
      UPDATE items
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    const result = db.prepare(query).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get updated item
    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Get top items
app.get('/api/analytics/top-items', (req, res) => {
  try {
    const { year, limit = 10 } = req.query;

    let whereClause = year ? 'WHERE year_range = ?' : '';
    let params = year ? [year, limit] : [limit];

    const query = `
      SELECT
        item_name,
        SUM(item_quantity) as total_quantity,
        COUNT(*) as checkout_count
      FROM items
      ${whereClause}
      GROUP BY LOWER(item_name)
      ORDER BY total_quantity DESC
      LIMIT ?
    `;

    const topItems = db.prepare(query).all(...params);

    res.json(topItems);
  } catch (error) {
    console.error('Error fetching top items:', error);
    res.status(500).json({ error: 'Failed to fetch top items' });
  }
});

// Get checkout by ID with all items
app.get('/api/checkouts/:id', (req, res) => {
  try {
    const { id } = req.params;

    const checkout = db.prepare('SELECT * FROM checkouts WHERE id = ?').get(id);

    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    const items = db.prepare('SELECT * FROM items WHERE checkout_id = ?').all(id);

    res.json({
      ...checkout,
      items
    });
  } catch (error) {
    console.error('Error fetching checkout:', error);
    res.status(500).json({ error: 'Failed to fetch checkout' });
  }
});

// Search items
app.get('/api/items/search', (req, res) => {
  try {
    const { query, year, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    let whereClause = ['item_name LIKE ?'];
    let params = [`%${query}%`];

    if (year) {
      whereClause.push('year_range = ?');
      params.push(year);
    }

    params.push(limit);

    const searchQuery = `
      SELECT
        items.*,
        checkouts.owner_name,
        checkouts.email,
        checkouts.date
      FROM items
      JOIN checkouts ON items.checkout_id = checkouts.id
      WHERE ${whereClause.join(' AND ')}
      ORDER BY items.created_at DESC
      LIMIT ?
    `;

    const results = db.prepare(searchQuery).all(...params);

    res.json(results);
  } catch (error) {
    console.error('Error searching items:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 ReUSE Store API Server running at http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   GET  /api/health                    - Health check`);
  console.log(`   GET  /api/years                     - Get all year ranges`);
  console.log(`   GET  /api/statistics                - Get statistics (optional ?year=)`);
  console.log(`   GET  /api/checkouts                 - Get checkouts (optional ?year=, ?page=, ?limit=)`);
  console.log(`   GET  /api/checkouts/:id             - Get checkout by ID with items`);
  console.log(`   GET  /api/verification/items        - Get items for verification`);
  console.log(`   PATCH /api/verification/items/:id   - Update item verification status`);
  console.log(`   GET  /api/analytics/top-items       - Get top items (optional ?year=)`);
  console.log(`   GET  /api/items/search              - Search items (required ?query=)\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Closing database connection...');
  db.close();
  process.exit(0);
});
