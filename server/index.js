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

// Get checkouts (grouped by session) for verification
app.get('/api/verification/checkouts', (req, res) => {
  try {
    const { year, status = 'pending', page = 1, limit = 50, lastMonthOnly = 'false' } = req.query;
    const offset = (page - 1) * limit;

    let itemWhere = ['verification_status = ?'];
    let itemParams = [status];

    if (lastMonthOnly === 'true' && status === 'approved') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      itemWhere.push("verified_at >= datetime(?)");
      itemParams.push(oneMonthAgo.toISOString());
    }

    let checkoutWhere = [];
    if (year) {
      checkoutWhere.push('checkouts.year_range = ?');
      itemParams.push(year);
    }

    const itemWhereClause = itemWhere.join(' AND ');
    const checkoutWhereClause = checkoutWhere.length > 0 ? 'WHERE ' + checkoutWhere.join(' AND ') : '';

    // Get checkouts that have items with specified status
    const checkoutsQuery = `
      SELECT DISTINCT checkouts.*
      FROM checkouts
      JOIN items ON checkouts.id = items.checkout_id
      ${checkoutWhereClause}
      ${checkoutWhere.length > 0 ? 'AND' : 'WHERE'} ${itemWhereClause}
      ORDER BY checkouts.date DESC, checkouts.id DESC
      LIMIT ? OFFSET ?
    `;

    const checkouts = db.prepare(checkoutsQuery).all(...itemParams, limit, offset);

    // For each checkout, get all its items
    const checkoutsWithItems = checkouts.map(checkout => {
      const items = db.prepare(`
        SELECT * FROM items
        WHERE checkout_id = ?
        ORDER BY id ASC
      `).all(checkout.id);

      return {
        ...checkout,
        items,
        totalItems: items.length
      };
    });

    // Get stats (count of unique checkout sessions)
    const stats = {
      pending: db.prepare('SELECT COUNT(DISTINCT checkout_id) as count FROM items WHERE verification_status = ?').get('pending').count,
      approved: (() => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return db.prepare(
          'SELECT COUNT(DISTINCT checkout_id) as count FROM items WHERE verification_status = ? AND verified_at >= datetime(?)'
        ).get('approved', oneMonthAgo.toISOString()).count;
      })(),
      flagged: db.prepare('SELECT COUNT(DISTINCT checkout_id) as count FROM items WHERE verification_status = ?').get('flagged').count
    };

    res.json({
      checkouts: checkoutsWithItems,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: checkoutsWithItems.length
      }
    });
  } catch (error) {
    console.error('Error fetching verification checkouts:', error);
    res.status(500).json({ error: 'Failed to fetch verification checkouts' });
  }
});

// Get items for verification with pagination
app.get('/api/verification/items', (req, res) => {
  try {
    const { year, status = 'pending', page = 1, limit = 100, lastMonthOnly = 'false' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = ['verification_status = ?'];
    let params = [status];

    if (year) {
      whereClause.push('year_range = ?');
      params.push(year);
    }

    // For approved tab, only show items from last month
    if (lastMonthOnly === 'true' && status === 'approved') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      whereClause.push("verified_at >= datetime(?)");
      params.push(oneMonthAgo.toISOString());
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

    // Get stats for all statuses
    const stats = {
      pending: db.prepare('SELECT COUNT(*) as count FROM items WHERE verification_status = ?').get('pending').count,
      approved: (() => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return db.prepare(
          'SELECT COUNT(*) as count FROM items WHERE verification_status = ? AND verified_at >= datetime(?)'
        ).get('approved', oneMonthAgo.toISOString()).count;
      })(),
      flagged: db.prepare('SELECT COUNT(*) as count FROM items WHERE verification_status = ?').get('flagged').count
    };

    res.json({
      items,
      stats,
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

// Update all items in a checkout session
app.patch('/api/verification/checkouts/:checkoutId', (req, res) => {
  try {
    const { checkoutId } = req.params;
    const { status, verifiedAt } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Update all items in this checkout
    const result = db.prepare(`
      UPDATE items
      SET verification_status = ?,
          flagged = ?,
          verified_at = CURRENT_TIMESTAMP
      WHERE checkout_id = ?
    `).run(status, status === 'flagged' ? 1 : 0, checkoutId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    res.json({
      success: true,
      checkoutId,
      itemsUpdated: result.changes,
      status
    });
  } catch (error) {
    console.error('Error updating checkout:', error);
    res.status(500).json({ error: 'Failed to update checkout' });
  }
});

// Update item verification status
app.patch('/api/verification/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, verification_status, flagged, verified_by, image_url, verifiedAt } = req.body;

    const updates = [];
    const params = [];

    // Handle both 'status' and 'verification_status' for backwards compatibility
    const newStatus = status || verification_status;

    if (newStatus) {
      updates.push('verification_status = ?');
      params.push(newStatus);

      // Set flagged field based on status
      if (newStatus === 'flagged') {
        updates.push('flagged = ?');
        params.push(1);
      } else if (newStatus === 'approved') {
        updates.push('flagged = ?');
        params.push(0);
      }
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

    // Update verified_at timestamp
    if (newStatus === 'approved' || newStatus === 'flagged' || verifiedAt) {
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

// Search donors (for autocomplete in ProductLogForm)
// Returns most recent information for each unique email (case-insensitive)
app.get('/api/donors/search', (req, res) => {
  try {
    const { q = '' } = req.query;

    const query = `
      SELECT
        owner_name as name,
        email,
        housing_assignment as housing,
        graduation_year as gradYear
      FROM checkouts
      WHERE (owner_name LIKE ? OR email LIKE ?)
        AND id IN (
          SELECT MAX(id)
          FROM checkouts
          GROUP BY LOWER(email)
        )
      ORDER BY owner_name
      LIMIT 50
    `;

    const donors = db.prepare(query).all(`%${q}%`, `%${q}%`);
    res.json(donors);
  } catch (error) {
    console.error('Error searching donors:', error);
    res.status(500).json({ error: 'Failed to search donors' });
  }
});

// Get all categories
app.get('/api/categories', (req, res) => {
  try {
    const query = `
      SELECT
        item_name as name,
        COUNT(*) as timesUsed
      FROM items
      GROUP BY item_name
      ORDER BY timesUsed DESC
      LIMIT 100
    `;

    const categories = db.prepare(query).all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category (mock - just returns the category name)
app.post('/api/categories', (req, res) => {
  try {
    const { name, createdBy } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Return mock category object
    res.json({
      name,
      timesUsed: 0,
      createdBy: createdBy || 'unknown'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Submit new product (creates checkout and item)
app.post('/api/products', (req, res) => {
  try {
    const {
      donorName,
      email,
      housing,
      gradYear,
      categoryName,
      description,
      photoUrl
    } = req.body;

    // Validate required fields
    if (!donorName || !email || !categoryName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get current academic year range (e.g., "2025-2026")
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth();
    const yearRange = month >= 7 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;

    // Insert checkout
    const checkoutResult = db.prepare(`
      INSERT INTO checkouts (
        date,
        owner_name,
        email,
        housing_assignment,
        graduation_year,
        year_range
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      new Date().toISOString(),
      donorName,
      email,
      housing || '',
      gradYear || '',
      yearRange
    );

    const checkoutId = checkoutResult.lastInsertRowid;

    // Insert item
    const itemResult = db.prepare(`
      INSERT INTO items (
        checkout_id,
        item_name,
        item_quantity,
        year_range,
        image_url,
        description
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      checkoutId,
      categoryName,
      1,
      yearRange,
      photoUrl || null,
      description || null
    );

    res.json({
      success: true,
      checkoutId,
      itemId: itemResult.lastInsertRowid,
      message: 'Product logged successfully'
    });
  } catch (error) {
    console.error('Error submitting product:', error);
    res.status(500).json({ error: 'Failed to submit product' });
  }
});

// Mock photo upload endpoint (just returns a placeholder URL)
app.post('/api/upload', (req, res) => {
  try {
    // In a real implementation, this would upload to Google Drive or cloud storage
    const mockPhotoUrl = `https://placeholder.com/photo-${Date.now()}.jpg`;

    res.json({
      success: true,
      url: mockPhotoUrl
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
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
  console.log(`   GET  /api/donors/search             - Search donors (optional ?q=)`);
  console.log(`   GET  /api/categories                - Get all categories`);
  console.log(`   POST /api/categories                - Create new category`);
  console.log(`   POST /api/products                  - Submit new product`);
  console.log(`   POST /api/upload                    - Upload photo (mock)`);
  console.log(`   GET  /api/verification/items        - Get items for verification`);
  console.log(`   PATCH /api/verification/items/:id   - Update item verification status`);
  console.log(`   GET  /api/verification/checkouts    - Get grouped checkouts for verification`);
  console.log(`   PATCH /api/verification/checkouts/:checkoutId - Update checkout verification status`);
  console.log(`   GET  /api/analytics/top-items       - Get top items (optional ?year=)`);
  console.log(`   GET  /api/items/search              - Search items (required ?query=)\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Closing database connection...');
  db.close();
  process.exit(0);
});
