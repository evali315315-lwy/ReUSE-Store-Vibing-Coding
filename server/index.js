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

    // Fetch items with fridge information for each checkout
    const checkoutsWithItems = checkouts.map(checkout => {
      const items = db.prepare(`
        SELECT
          items.*,
          fridges.company as fridge_company,
          fridges.model as fridge_model,
          fridges.size as fridge_size,
          fridges.condition as fridge_condition
        FROM items
        LEFT JOIN fridges ON items.fridge_id = fridges.id
        WHERE items.checkout_id = ?
        ORDER BY items.id
      `).all(checkout.id);

      return {
        ...checkout,
        items
      };
    });

    res.json({
      checkouts: checkoutsWithItems,
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

    let checkoutWhere = ['checkouts.needs_approval = 1']; // Only show checkouts flagged for approval

    // Respect the year parameter if provided (show all years by default)
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
      AND ${itemWhereClause}
      ORDER BY checkouts.date DESC, checkouts.id DESC
      LIMIT ? OFFSET ?
    `;

    const checkouts = db.prepare(checkoutsQuery).all(...itemParams, limit, offset);

    // Get all items for these checkouts in a single query (optimized - reduces N+1 queries)
    let checkoutsWithItems = [];
    if (checkouts.length > 0) {
      const checkoutIds = checkouts.map(c => c.id);
      const placeholders = checkoutIds.map(() => '?').join(',');
      const allItems = db.prepare(`
        SELECT
          items.*,
          fridges.company as fridge_company,
          fridges.model as fridge_model,
          fridges.size as fridge_size,
          fridges.condition as fridge_condition
        FROM items
        LEFT JOIN fridges ON items.fridge_id = fridges.id
        WHERE checkout_id IN (${placeholders})
        ORDER BY checkout_id ASC, id ASC
      `).all(...checkoutIds);

      // Group items by checkout_id
      const itemsByCheckout = {};
      allItems.forEach(item => {
        if (!itemsByCheckout[item.checkout_id]) {
          itemsByCheckout[item.checkout_id] = [];
        }
        itemsByCheckout[item.checkout_id].push(item);
      });

      // Attach items to checkouts
      checkoutsWithItems = checkouts.map(checkout => ({
        ...checkout,
        items: itemsByCheckout[checkout.id] || [],
        totalItems: (itemsByCheckout[checkout.id] || []).length
      }));
    }

    // Get stats (count of unique checkout sessions that need approval - all years)
    const stats = {
      pending: db.prepare(`
        SELECT COUNT(DISTINCT items.checkout_id) as count
        FROM items
        JOIN checkouts ON items.checkout_id = checkouts.id
        WHERE items.verification_status = ?
        AND checkouts.needs_approval = 1
      `).get('pending').count,
      approved: (() => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return db.prepare(`
          SELECT COUNT(DISTINCT items.checkout_id) as count
          FROM items
          JOIN checkouts ON items.checkout_id = checkouts.id
          WHERE items.verification_status = ?
          AND items.verified_at >= datetime(?)
          AND checkouts.needs_approval = 1
        `).get('approved', oneMonthAgo.toISOString()).count;
      })(),
      flagged: db.prepare(`
        SELECT COUNT(DISTINCT items.checkout_id) as count
        FROM items
        JOIN checkouts ON items.checkout_id = checkouts.id
        WHERE items.verification_status = ?
        AND checkouts.needs_approval = 1
      `).get('flagged').count
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

    // Insert checkout (with needs_approval flag set to 1 for photo verification)
    const checkoutResult = db.prepare(`
      INSERT INTO checkouts (
        date,
        owner_name,
        email,
        housing_assignment,
        graduation_year,
        year_range,
        needs_approval
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      new Date().toISOString(),
      donorName,
      email,
      housing || '',
      gradYear || '',
      yearRange,
      1  // Set needs_approval = 1 for new donations
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

// ============================================================================
// CHECK-IN / CHECK-OUT SYSTEM API ENDPOINTS
// ============================================================================

// Student Management Endpoints
// Search students (for autofill)
app.get('/api/students/search', (req, res) => {
  try {
    const { q = '', withFridgesOnly = 'false' } = req.query;

    let query;
    if (withFridgesOnly === 'true') {
      // Only return students with active fridge checkouts
      query = `
        SELECT DISTINCT s.id, s.name, s.email, s.housing_assignment, s.graduation_year as gradYear
        FROM students s
        JOIN checkouts_out co ON co.student_id = s.id
        JOIN checkout_items ci ON ci.checkout_id = co.id
        JOIN fridge_inventory fi ON fi.id = ci.fridge_id
        WHERE (s.name LIKE ? OR s.email LIKE ?)
          AND co.status = 'active'
          AND fi.status = 'checked_out'
        ORDER BY s.name
        LIMIT 50
      `;
    } else {
      // Return all students
      query = `
        SELECT id, name, email, housing_assignment, graduation_year as gradYear
        FROM students
        WHERE name LIKE ? OR email LIKE ?
        ORDER BY name
        LIMIT 50
      `;
    }

    const students = db.prepare(query).all(`%${q}%`, `%${q}%`);
    res.json(students);
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ error: 'Failed to search students' });
  }
});

// Get student by email
app.get('/api/students/:email', (req, res) => {
  try {
    const { email } = req.params;

    const student = db.prepare(`
      SELECT id, name, email, housing_assignment, graduation_year as gradYear
      FROM students
      WHERE email = ?
    `).get(email);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create or update student
app.post('/api/students', (req, res) => {
  try {
    const { name, email, housing, gradYear } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Try to find existing student
    const existing = db.prepare('SELECT id FROM students WHERE email = ?').get(email);

    if (existing) {
      // Update existing student
      db.prepare(`
        UPDATE students
        SET name = ?, housing_assignment = ?, graduation_year = ?, updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `).run(name, housing || null, gradYear || null, email);

      res.json({ id: existing.id, name, email, housing, gradYear });
    } else {
      // Create new student
      const result = db.prepare(`
        INSERT INTO students (name, email, housing_assignment, graduation_year)
        VALUES (?, ?, ?, ?)
      `).run(name, email, housing || null, gradYear || null);

      res.json({ id: result.lastInsertRowid, name, email, housing, gradYear });
    }
  } catch (error) {
    console.error('Error creating/updating student:', error);
    res.status(500).json({ error: 'Failed to create/update student' });
  }
});

// Inventory Item Endpoints
// Search inventory items (for check-out)
app.get('/api/inventory/search', (req, res) => {
  try {
    const { q = '' } = req.query;

    const query = `
      SELECT id, sku, name, category, available_quantity
      FROM inventory_items
      WHERE (name LIKE ? OR sku LIKE ?) AND available_quantity > 0
      ORDER BY name
      LIMIT 50
    `;

    const items = db.prepare(query).all(`%${q}%`, `%${q}%`);
    res.json(items);
  } catch (error) {
    console.error('Error searching inventory:', error);
    res.status(500).json({ error: 'Failed to search inventory' });
  }
});

// Get all inventory items (admin only - no auth yet, will add later)
app.get('/api/inventory', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT id, sku, name, category, current_quantity, available_quantity
      FROM inventory_items
      ORDER BY name
    `).all();

    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Create new inventory item
app.post('/api/inventory', (req, res) => {
  try {
    const { name, category = 'Other', quantity = 1, createdBy } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    // Generate SKU (simple format: first 3 letters + random number)
    const prefix = name.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 100000);
    const sku = `${prefix}${randomNum}`;

    const stmt = db.prepare(`
      INSERT INTO inventory_items (sku, name, category, current_quantity, available_quantity, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(sku, name.trim(), category, quantity, quantity, createdBy || null);

    res.json({
      success: true,
      id: result.lastInsertRowid,
      sku,
      name: name.trim(),
      category,
      current_quantity: quantity,
      available_quantity: quantity
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'An item with this SKU already exists' });
    }
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Fridge Management Endpoints
// Get fridge attribute options (from dynamic tables)
app.get('/api/fridges/attributes', (req, res) => {
  try {
    const sizes = db.prepare('SELECT name FROM fridge_sizes ORDER BY id').all().map(r => r.name);
    const colors = db.prepare('SELECT name FROM fridge_colors ORDER BY id').all().map(r => r.name);
    const brands = db.prepare('SELECT name FROM fridge_brands ORDER BY name').all().map(r => r.name);
    const conditions = db.prepare('SELECT name FROM fridge_conditions ORDER BY id').all().map(r => r.name);

    res.json({ sizes, colors, brands, conditions });
  } catch (error) {
    console.error('Error fetching fridge attributes:', error);
    res.status(500).json({ error: 'Failed to fetch fridge attributes' });
  }
});

// Add new fridge attribute (workers and admins can both add)
app.post('/api/fridges/attributes/sizes', (req, res) => {
  try {
    const { name, createdBy } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Size name is required' });
    }
    const stmt = db.prepare('INSERT INTO fridge_sizes (name, created_by) VALUES (?, ?)');
    const result = stmt.run(name.trim(), createdBy || null);
    res.json({ success: true, id: result.lastInsertRowid, name: name.trim() });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This size already exists' });
    }
    console.error('Error adding fridge size:', error);
    res.status(500).json({ error: 'Failed to add fridge size' });
  }
});

app.post('/api/fridges/attributes/colors', (req, res) => {
  try {
    const { name, createdBy } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Color name is required' });
    }
    const stmt = db.prepare('INSERT INTO fridge_colors (name, created_by) VALUES (?, ?)');
    const result = stmt.run(name.trim(), createdBy || null);
    res.json({ success: true, id: result.lastInsertRowid, name: name.trim() });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This color already exists' });
    }
    console.error('Error adding fridge color:', error);
    res.status(500).json({ error: 'Failed to add fridge color' });
  }
});

app.post('/api/fridges/attributes/brands', (req, res) => {
  try {
    const { name, createdBy } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required' });
    }
    const stmt = db.prepare('INSERT INTO fridge_brands (name, created_by) VALUES (?, ?)');
    const result = stmt.run(name.trim(), createdBy || null);
    res.json({ success: true, id: result.lastInsertRowid, name: name.trim() });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This brand already exists' });
    }
    console.error('Error adding fridge brand:', error);
    res.status(500).json({ error: 'Failed to add fridge brand' });
  }
});

app.post('/api/fridges/attributes/conditions', (req, res) => {
  try {
    const { name, createdBy } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Condition name is required' });
    }
    const stmt = db.prepare('INSERT INTO fridge_conditions (name, created_by) VALUES (?, ?)');
    const result = stmt.run(name.trim(), createdBy || null);
    res.json({ success: true, id: result.lastInsertRowid, name: name.trim() });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This condition already exists' });
    }
    console.error('Error adding fridge condition:', error);
    res.status(500).json({ error: 'Failed to add fridge condition' });
  }
});

// GET /api/fridges/checkouts/active - Get all active checkouts (MUST BE BEFORE :studentEmail route)
app.get('/api/fridges/checkouts/active', (req, res) => {
  try {
    const checkouts = db.prepare(`
      SELECT
        fc.id,
        fi.fridge_number,
        fi.brand,
        fi.size,
        fi.color,
        fi.condition,
        fc.student_name,
        fc.student_email,
        fc.housing_assignment,
        fc.checkout_date,
        fc.expected_return_date,
        fc.status
      FROM fridge_checkouts fc
      JOIN fridge_inventory fi ON fi.id = fc.fridge_id
      WHERE fc.status = 'active'
      ORDER BY fc.checkout_date DESC
    `).all();

    res.json({ checkouts });
  } catch (error) {
    console.error('Error fetching active checkouts:', error);
    res.status(500).json({ error: 'Failed to fetch checkouts' });
  }
});

// Get student's active fridge checkouts
app.get('/api/fridges/checkouts/:studentEmail', (req, res) => {
  try {
    const { studentEmail } = req.params;

    const query = `
      SELECT
        fi.id as fridgeId,
        fi.fridge_number as fridgeNumber,
        fi.brand,
        fi.has_freezer as hasFreezer,
        fi.size,
        fi.color,
        fi.condition,
        co.checkout_date as checkoutDate,
        co.id as checkoutId
      FROM fridge_inventory fi
      JOIN checkout_items ci ON ci.fridge_id = fi.id
      JOIN checkouts_out co ON co.id = ci.checkout_id
      JOIN students s ON s.id = co.student_id
      WHERE s.email = ? AND co.status = 'active' AND fi.status = 'checked_out'
      ORDER BY co.checkout_date DESC
    `;

    const checkouts = db.prepare(query).all(studentEmail);
    res.json(checkouts);
  } catch (error) {
    console.error('Error fetching student fridge checkouts:', error);
    res.status(500).json({ error: 'Failed to fetch fridge checkouts' });
  }
});

// Return fridge
app.post('/api/fridges/return', (req, res) => {
  try {
    const { fridgeId, studentEmail, returnedBy } = req.body;

    if (!fridgeId || !studentEmail) {
      return res.status(400).json({ error: 'Fridge ID and student email are required' });
    }

    db.prepare('BEGIN').run();

    try {
      // Find the active checkout
      const checkout = db.prepare(`
        SELECT co.id, co.student_id
        FROM checkouts_out co
        JOIN students s ON s.id = co.student_id
        JOIN checkout_items ci ON ci.checkout_id = co.id
        WHERE s.email = ? AND ci.fridge_id = ? AND co.status = 'active'
        LIMIT 1
      `).get(studentEmail, fridgeId);

      if (!checkout) {
        db.prepare('ROLLBACK').run();
        return res.status(404).json({ error: 'No active checkout found for this fridge and student' });
      }

      // Update fridge status to available
      db.prepare('UPDATE fridge_inventory SET status = ?, current_checkout_id = NULL WHERE id = ?')
        .run('available', fridgeId);

      // Check if this was the only item in the checkout
      const itemCount = db.prepare('SELECT COUNT(*) as count FROM checkout_items WHERE checkout_id = ?')
        .get(checkout.id).count;

      if (itemCount === 1) {
        // If only item, mark entire checkout as returned
        db.prepare('UPDATE checkouts_out SET status = ?, actual_return_date = CURRENT_TIMESTAMP WHERE id = ?')
          .run('returned', checkout.id);
      } else {
        // Otherwise, just remove this item from checkout
        db.prepare('DELETE FROM checkout_items WHERE checkout_id = ? AND fridge_id = ?')
          .run(checkout.id, fridgeId);
      }

      // Create a check-in record for the returned fridge
      const checkinStmt = db.prepare('INSERT INTO checkins (checked_in_by, notes) VALUES (?, ?)');
      const checkinResult = checkinStmt.run(returnedBy || 'system', `Fridge return from ${studentEmail}`);

      db.prepare('INSERT INTO checkin_items (checkin_id, fridge_id, quantity) VALUES (?, ?, 1)')
        .run(checkinResult.lastInsertRowid, fridgeId);

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        message: 'Fridge returned successfully',
        fridgeId,
        checkoutId: checkout.id
      });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error returning fridge:', error);
    res.status(500).json({ error: 'Failed to return fridge' });
  }
});

// Check in NEW fridge to inventory
app.post('/api/fridges/checkin', (req, res) => {
  try {
    const { hasFreezer, size, color, brand, condition, notes, checkedInBy } = req.body;

    if (hasFreezer === undefined || hasFreezer === null) {
      return res.status(400).json({ error: 'Fridge type (with/without freezer) is required' });
    }

    db.prepare('BEGIN').run();

    try {
      // Get next fridge number
      const maxFridge = db.prepare('SELECT MAX(fridge_number) as max FROM fridge_inventory').get();
      const nextFridgeNumber = (maxFridge.max || 0) + 1;

      // Insert new fridge
      const fridgeStmt = db.prepare(`
        INSERT INTO fridge_inventory
        (fridge_number, has_freezer, size, color, brand, condition, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
      `);
      const fridgeResult = fridgeStmt.run(
        nextFridgeNumber,
        hasFreezer ? 1 : 0,
        size || null,
        color || null,
        brand || null,
        condition || 'Good',
        notes || null
      );

      // Create check-in record
      const checkinStmt = db.prepare('INSERT INTO checkins (checked_in_by, notes) VALUES (?, ?)');
      const checkinResult = checkinStmt.run(
        checkedInBy || 'worker@haverford.edu',
        `New fridge #${nextFridgeNumber} added to inventory`
      );

      db.prepare('INSERT INTO checkin_items (checkin_id, fridge_id, quantity) VALUES (?, ?, 1)')
        .run(checkinResult.lastInsertRowid, fridgeResult.lastInsertRowid);

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        message: 'Fridge checked in successfully',
        fridgeId: fridgeResult.lastInsertRowid,
        fridgeNumber: nextFridgeNumber,
        checkinId: checkinResult.lastInsertRowid
      });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error checking in fridge:', error);
    res.status(500).json({ error: 'Failed to check in fridge' });
  }
});

// Search available fridges for check-out
app.get('/api/fridges/available', (req, res) => {
  try {
    const { has_freezer } = req.query;

    let query = `
      SELECT id, fridge_number, has_freezer, size, color, brand, condition
      FROM fridge_inventory
      WHERE status = 'available'
    `;

    const params = [];
    if (has_freezer !== undefined) {
      query += ' AND has_freezer = ?';
      params.push(has_freezer === 'true' ? 1 : 0);
    }

    query += ' ORDER BY fridge_number';

    const fridges = db.prepare(query).all(...params);
    res.json(fridges);
  } catch (error) {
    console.error('Error fetching available fridges:', error);
    res.status(500).json({ error: 'Failed to fetch available fridges' });
  }
});

// GET /api/fridges/stats - Get fridge inventory statistics (MUST BE BEFORE :number route)
app.get('/api/fridges/stats', (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM fridge_inventory').get().count,
      available: db.prepare('SELECT COUNT(*) as count FROM fridge_inventory WHERE status = ?').get('available').count,
      checkedOut: db.prepare('SELECT COUNT(*) as count FROM fridge_inventory WHERE status = ?').get('checked_out').count,
      maintenance: db.prepare('SELECT COUNT(*) as count FROM fridge_inventory WHERE status = ?').get('maintenance').count,
      overdue: db.prepare(`
        SELECT COUNT(*) as count
        FROM fridge_checkouts
        WHERE status = 'active'
        AND DATE(expected_return_date) < DATE('now')
      `).get().count
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching fridge stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/fridges - Get all fridges with optional status filter (BEFORE :number route)
app.get('/api/fridges', (req, res) => {
  try {
    const { status } = req.query;

    let query = 'SELECT * FROM fridge_inventory';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY fridge_number';

    const fridges = db.prepare(query).all(...params);

    res.json({ fridges });
  } catch (error) {
    console.error('Error fetching fridges:', error);
    res.status(500).json({ error: 'Failed to fetch fridges' });
  }
});

// POST /api/fridges/checkout - Check out a fridge to a student
app.post('/api/fridges/checkout', (req, res) => {
  try {
    const {
      fridgeId,
      studentName,
      studentEmail,
      housingAssignment,
      checkedOutBy
    } = req.body;

    db.prepare('BEGIN').run();

    try {
      // Create or get student
      let student = db.prepare('SELECT id FROM students WHERE email = ?').get(studentEmail);

      if (!student) {
        const result = db.prepare(`
          INSERT INTO students (name, email, housing_assignment)
          VALUES (?, ?, ?)
        `).run(studentName, studentEmail, housingAssignment || null);
        student = { id: result.lastInsertRowid };
      }

      // Create checkout record
      const checkoutResult = db.prepare(`
        INSERT INTO checkouts_out (student_id, checked_out_by)
        VALUES (?, ?)
      `).run(student.id, checkedOutBy || 'system');

      // Add fridge to checkout
      db.prepare(`
        INSERT INTO checkout_items (checkout_id, fridge_id, quantity)
        VALUES (?, ?, 1)
      `).run(checkoutResult.lastInsertRowid, fridgeId);

      // Update fridge status
      db.prepare(`
        UPDATE fridge_inventory
        SET status = 'checked_out', current_checkout_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(checkoutResult.lastInsertRowid, fridgeId);

      db.prepare('COMMIT').run();

      res.status(201).json({
        success: true,
        checkoutId: checkoutResult.lastInsertRowid
      });

    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error checking out fridge:', error);
    res.status(500).json({ error: 'Failed to checkout fridge' });
  }
});

// PATCH /api/fridges/checkout/:id/return - Check in a returned fridge
app.patch('/api/fridges/checkout/:id/return', (req, res) => {
  try {
    const checkoutId = parseInt(req.params.id);
    const { conditionAtReturn, notesReturn, checkedInBy } = req.body;

    db.prepare('BEGIN').run();

    try {
      // Update checkout status
      db.prepare(`
        UPDATE checkouts_out
        SET status = 'returned', actual_return_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(checkoutId);

      // Get fridges in this checkout
      const fridges = db.prepare(`
        SELECT fridge_id FROM checkout_items WHERE checkout_id = ?
      `).all(checkoutId);

      // Update fridge status
      fridges.forEach(f => {
        const newStatus = (conditionAtReturn === 'Needs Repair' || conditionAtReturn === 'Damaged')
          ? 'maintenance'
          : 'available';

        db.prepare(`
          UPDATE fridge_inventory
          SET status = ?, condition = ?, current_checkout_id = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newStatus, conditionAtReturn || 'Good', f.fridge_id);
      });

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        checkoutId
      });

    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error returning fridge:', error);
    res.status(500).json({ error: 'Failed to return fridge' });
  }
});

// Get fridge by number (THIS MUST COME AFTER MORE SPECIFIC ROUTES)
app.get('/api/fridges/:number', (req, res) => {
  try {
    const { number } = req.params;

    const fridge = db.prepare(`
      SELECT id, fridge_number, has_freezer, size, color, brand, condition, status, notes
      FROM fridge_inventory
      WHERE fridge_number = ?
    `).get(number);

    if (!fridge) {
      return res.status(404).json({ error: 'Fridge not found' });
    }

    res.json(fridge);
  } catch (error) {
    console.error('Error fetching fridge:', error);
    res.status(500).json({ error: 'Failed to fetch fridge' });
  }
});

// Check-Out Endpoints
// Create check-out transaction
app.post('/api/checkouts-out', (req, res) => {
  try {
    const { student, items, checkedOutBy, notes } = req.body;

    if (!student || !student.name || !student.email) {
      return res.status(400).json({ error: 'Student information is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Start transaction
    db.prepare('BEGIN').run();

    try {
      // Create or update student
      const existingStudent = db.prepare('SELECT id FROM students WHERE email = ?').get(student.email);
      let studentId;

      if (existingStudent) {
        studentId = existingStudent.id;
        db.prepare(`
          UPDATE students
          SET name = ?, housing_assignment = ?, graduation_year = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(student.name, student.housing || null, student.gradYear || null, studentId);
      } else {
        const result = db.prepare(`
          INSERT INTO students (name, email, housing_assignment, graduation_year)
          VALUES (?, ?, ?, ?)
        `).run(student.name, student.email, student.housing || null, student.gradYear || null);
        studentId = result.lastInsertRowid;
      }

      // Create checkout record
      const checkoutResult = db.prepare(`
        INSERT INTO checkouts_out (student_id, checked_out_by, notes)
        VALUES (?, ?, ?)
      `).run(studentId, checkedOutBy || null, notes || null);

      const checkoutId = checkoutResult.lastInsertRowid;

      // Add checkout items and update inventory
      for (const item of items) {
        if (item.type === 'item') {
          // Add checkout item
          db.prepare(`
            INSERT INTO checkout_items (checkout_id, item_id, quantity)
            VALUES (?, ?, ?)
          `).run(checkoutId, item.itemId, item.quantity);

          // Update inventory quantity
          db.prepare(`
            UPDATE inventory_items
            SET available_quantity = available_quantity - ?
            WHERE id = ?
          `).run(item.quantity, item.itemId);

        } else if (item.type === 'fridge') {
          // Add checkout item
          db.prepare(`
            INSERT INTO checkout_items (checkout_id, fridge_id, quantity)
            VALUES (?, ?, 1)
          `).run(checkoutId, item.fridgeId);

          // Update fridge status
          db.prepare(`
            UPDATE fridge_inventory
            SET status = 'checked_out', current_checkout_id = ?
            WHERE id = ?
          `).run(checkoutId, item.fridgeId);
        }
      }

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        checkoutId,
        message: 'Items checked out successfully'
      });

    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

// Get active check-outs
app.get('/api/checkouts-out/active', (req, res) => {
  try {
    const checkouts = db.prepare(`
      SELECT
        co.id,
        co.checkout_date,
        co.status,
        co.checked_out_by,
        co.notes,
        s.name as student_name,
        s.email as student_email,
        s.housing_assignment,
        s.graduation_year
      FROM checkouts_out co
      JOIN students s ON co.student_id = s.id
      WHERE co.status = 'active'
      ORDER BY co.checkout_date DESC
    `).all();

    // Get items for each checkout
    for (const checkout of checkouts) {
      const items = db.prepare(`
        SELECT
          ci.id,
          ci.quantity,
          CASE
            WHEN ci.item_id IS NOT NULL THEN 'item'
            ELSE 'fridge'
          END as type,
          COALESCE(ii.name, 'Fridge #' || fi.fridge_number) as name,
          ii.sku,
          fi.fridge_number,
          fi.brand
        FROM checkout_items ci
        LEFT JOIN inventory_items ii ON ci.item_id = ii.id
        LEFT JOIN fridge_inventory fi ON ci.fridge_id = fi.id
        WHERE ci.checkout_id = ?
      `).all(checkout.id);

      checkout.items = items;
    }

    res.json(checkouts);
  } catch (error) {
    console.error('Error fetching active checkouts:', error);
    res.status(500).json({ error: 'Failed to fetch active checkouts' });
  }
});

// Check-In Endpoints
// Search items/fridges for check-in
app.get('/api/checkins/search', (req, res) => {
  try {
    const { q = '' } = req.query;

    // Search inventory items
    const items = db.prepare(`
      SELECT id, sku, name, category, current_quantity, 'item' as type
      FROM inventory_items
      WHERE name LIKE ? OR sku LIKE ?
      LIMIT 25
    `).all(`%${q}%`, `%${q}%`);

    // Search fridges
    const fridges = db.prepare(`
      SELECT
        id,
        fridge_number,
        brand,
        has_freezer,
        status,
        'fridge' as type
      FROM fridge_inventory
      WHERE CAST(fridge_number AS TEXT) LIKE ? OR brand LIKE ?
      LIMIT 25
    `).all(`%${q}%`, `%${q}%`);

    res.json([...items, ...fridges]);
  } catch (error) {
    console.error('Error searching for check-in:', error);
    res.status(500).json({ error: 'Failed to search for check-in' });
  }
});

// Create check-in transaction
app.post('/api/checkins', (req, res) => {
  try {
    const { items, checkedInBy, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Start transaction
    db.prepare('BEGIN').run();

    try {
      // Create checkin record
      const checkinResult = db.prepare(`
        INSERT INTO checkins (checked_in_by, notes)
        VALUES (?, ?)
      `).run(checkedInBy || null, notes || null);

      const checkinId = checkinResult.lastInsertRowid;

      // Process each item
      for (const item of items) {
        if (item.type === 'item') {
          // Add checkin item
          db.prepare(`
            INSERT INTO checkin_items (checkin_id, item_id, quantity)
            VALUES (?, ?, ?)
          `).run(checkinId, item.itemId, item.quantity);

          // Update inventory quantity
          db.prepare(`
            UPDATE inventory_items
            SET available_quantity = available_quantity + ?,
                current_quantity = current_quantity + ?
            WHERE id = ?
          `).run(item.quantity, item.quantity, item.itemId);

        } else if (item.type === 'fridge') {
          // For fridges, check if this is a return or new fridge
          const existingFridge = db.prepare('SELECT id, fridge_number FROM fridge_inventory WHERE id = ?').get(item.fridgeId);

          if (existingFridge) {
            // Returning an existing fridge
            db.prepare(`
              INSERT INTO checkin_items (checkin_id, fridge_id, quantity)
              VALUES (?, ?, 1)
            `).run(checkinId, item.fridgeId);

            // Update fridge status to available
            db.prepare(`
              UPDATE fridge_inventory
              SET status = 'available', current_checkout_id = NULL
              WHERE id = ?
            `).run(item.fridgeId);

            // Mark associated checkout as returned if exists
            const checkoutId = db.prepare('SELECT current_checkout_id FROM fridge_inventory WHERE id = ?').get(item.fridgeId)?.current_checkout_id;
            if (checkoutId) {
              db.prepare(`
                UPDATE checkouts_out
                SET status = 'returned', actual_return_date = CURRENT_TIMESTAMP
                WHERE id = ?
              `).run(checkoutId);
            }
          } else {
            // New fridge being checked in - auto-generate fridge number
            const maxNumber = db.prepare('SELECT MAX(fridge_number) as max FROM fridge_inventory').get().max || 0;
            const newFridgeNumber = maxNumber + 1;

            const fridgeResult = db.prepare(`
              INSERT INTO fridge_inventory (fridge_number, has_freezer, brand, status, condition)
              VALUES (?, ?, ?, 'available', 'Good')
            `).run(newFridgeNumber, item.hasFreezer ? 1 : 0, item.brand || 'Unknown');

            // Add checkin item
            db.prepare(`
              INSERT INTO checkin_items (checkin_id, fridge_id, quantity)
              VALUES (?, ?, 1)
            `).run(checkinId, fridgeResult.lastInsertRowid);
          }
        }
      }

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        checkinId,
        message: 'Items checked in successfully'
      });

    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error creating checkin:', error);
    res.status(500).json({ error: 'Failed to create checkin' });
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
