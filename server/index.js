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
          fridge_companies.company as fridge_company_name
        FROM items
        LEFT JOIN fridge_companies ON items.fridge_company_id = fridge_companies.id
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
          fridge_companies.company as fridge_company_name
        FROM items
        LEFT JOIN fridge_companies ON items.fridge_company_id = fridge_companies.id
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

// Update checkout information
app.patch('/api/checkouts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { owner_name, email, housing_assignment, graduation_year } = req.body;

    // Check if checkout exists
    const checkout = db.prepare('SELECT * FROM checkouts WHERE id = ?').get(id);
    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    // Update checkout
    const stmt = db.prepare(`
      UPDATE checkouts
      SET owner_name = ?,
          email = ?,
          housing_assignment = ?,
          graduation_year = ?
      WHERE id = ?
    `);

    stmt.run(owner_name, email, housing_assignment, graduation_year, id);

    // Return updated checkout
    const updatedCheckout = db.prepare('SELECT * FROM checkouts WHERE id = ?').get(id);
    res.json(updatedCheckout);
  } catch (error) {
    console.error('Error updating checkout:', error);
    res.status(500).json({ error: 'Failed to update checkout' });
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

// Update item information
app.patch('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, description, item_quantity } = req.body;

    // Check if item exists
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update item
    const stmt = db.prepare(`
      UPDATE items
      SET item_name = ?,
          description = ?,
          item_quantity = ?
      WHERE id = ?
    `);

    stmt.run(item_name, description, item_quantity, id);

    // Return updated item
    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
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
    const searchPattern = `${q}%`; // Prefix search only

    if (withFridgesOnly === 'true') {
      // Only return students with active fridge checkouts
      // Fridge checkouts are identified by items with name like "Fridge #%"
      query = `
        SELECT DISTINCT
          c.id,
          c.owner_name as name,
          c.email,
          c.housing_assignment,
          c.graduation_year as gradYear
        FROM checkouts c
        JOIN items i ON i.checkout_id = c.id
        WHERE (c.owner_name LIKE ? OR c.email LIKE ?)
          AND i.item_name LIKE 'Fridge #%'
          AND i.verification_status = 'pending'
        ORDER BY c.owner_name
        LIMIT 50
      `;
    } else {
      // Return all students from checkouts (distinct by email)
      query = `
        SELECT DISTINCT
          MIN(id) as id,
          owner_name as name,
          email,
          housing_assignment,
          graduation_year as gradYear
        FROM checkouts
        WHERE owner_name LIKE ? OR email LIKE ?
        GROUP BY email
        ORDER BY owner_name
        LIMIT 50
      `;
    }

    const students = db.prepare(query).all(searchPattern, searchPattern);
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
      SELECT id, owner_name as name, email, housing_assignment, graduation_year as gradYear
      FROM checkouts
      WHERE email = ?
      ORDER BY id DESC
      LIMIT 1
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
    const searchPattern = `${q}%`; // Prefix search only

    // Query items table and aggregate by item_name
    // Only include approved donated items (these are available for checkout to students)
    // Exclude fridge records: items with fridge_company_id OR items named "Fridge" or "Fridge #X"
    const query = `
      SELECT
        item_name as name,
        COUNT(*) as available_quantity,
        'ITEM-' || SUBSTR(UPPER(item_name), 1, 3) || '-' || MIN(id) as sku,
        'Donation' as category
      FROM items
      WHERE item_name LIKE ?
        AND verification_status = 'approved'
        AND fridge_company_id IS NULL
        AND item_name NOT LIKE 'Fridge%'
      GROUP BY item_name
      HAVING COUNT(*) > 0
      ORDER BY item_name
      LIMIT 50
    `;

    const items = db.prepare(query).all(searchPattern);

    // Add an id field for each aggregated item (use a hash of the name)
    const itemsWithId = items.map((item, index) => ({
      id: index + 1000, // Use offset to avoid conflicts
      name: item.name,
      sku: item.sku,
      category: item.category,
      available_quantity: item.available_quantity
    }));

    res.json(itemsWithId);
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
// Get fridge attribute options (from fridges table)
app.get('/api/fridges/attributes', (req, res) => {
  try {
    // Get brands from database
    const brands = db.prepare('SELECT DISTINCT brand FROM fridges WHERE brand IS NOT NULL ORDER BY brand').all().map(r => r.brand);

    // Get sizes from database and clean up "Full Size with Freezer" -> "Full Size"
    // Since freezer is a separate field in the form
    const dbSizes = db.prepare('SELECT DISTINCT size FROM fridges WHERE size IS NOT NULL').all().map(r => r.size);
    const sizes = [...new Set(dbSizes.map(s => s.replace(/\s+with\s+Freezer/i, '').trim()))].sort();

    // Standard fridge colors (color field exists but not populated in database)
    const colors = ['White', 'Black', 'Stainless Steel', 'Silver', 'Gray', 'Red', 'Blue'];

    // Standard fridge conditions (database only has Good/Needs Repair, but provide full range)
    const conditions = ['Excellent', 'Great', 'Good', 'Fair', 'Needs Repair', 'Poor'];

    res.json({
      sizes,
      colors,
      brands,
      conditions
    });
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
    // Query checkouts table where items have names like "Fridge #%"
    // These are migrated from old fridge_checkouts table
    const checkouts = db.prepare(`
      SELECT
        c.id,
        i.item_name as fridge_identifier,
        f.fridge_number,
        f.brand,
        f.size,
        f.color,
        f.condition,
        c.owner_name as student_name,
        c.email as student_email,
        c.housing_assignment,
        c.date as checkout_date,
        i.verification_status
      FROM checkouts c
      JOIN items i ON i.checkout_id = c.id
      LEFT JOIN fridges f ON i.item_name = 'Fridge #' || f.fridge_number
      WHERE i.item_name LIKE 'Fridge #%'
        AND i.verification_status = 'pending'
      ORDER BY c.date DESC
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
        f.id as fridgeId,
        f.fridge_number as fridgeNumber,
        f.brand,
        f.has_freezer as hasFreezer,
        f.size,
        f.color,
        f.condition,
        c.date as checkoutDate,
        c.id as checkoutId
      FROM checkouts c
      JOIN items i ON i.checkout_id = c.id
      JOIN fridges f ON i.item_name = 'Fridge #' || f.fridge_number
      WHERE c.email = ?
        AND i.item_name LIKE 'Fridge #%'
        AND i.verification_status = 'pending'
      ORDER BY c.date DESC
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
      // Find the fridge to get its number
      const fridge = db.prepare('SELECT fridge_number FROM fridges WHERE id = ?').get(fridgeId);

      if (!fridge) {
        db.prepare('ROLLBACK').run();
        return res.status(404).json({ error: 'Fridge not found' });
      }

      // Find the active checkout item for this fridge
      const item = db.prepare(`
        SELECT i.id as itemId, i.checkout_id, c.id as checkoutId
        FROM items i
        JOIN checkouts c ON c.id = i.checkout_id
        WHERE c.email = ?
          AND i.item_name = ?
          AND i.verification_status = 'pending'
        LIMIT 1
      `).get(studentEmail, `Fridge #${fridge.fridge_number}`);

      if (!item) {
        db.prepare('ROLLBACK').run();
        return res.status(404).json({ error: 'No active checkout found for this fridge and student' });
      }

      // Update item status to returned
      db.prepare('UPDATE items SET status = ?, return_date = CURRENT_TIMESTAMP WHERE id = ?')
        .run('returned', item.itemId);

      // Update fridge status to available
      db.prepare('UPDATE fridges SET status = ? WHERE id = ?')
        .run('available', fridgeId);

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        message: 'Fridge returned successfully',
        fridgeId,
        checkoutId: item.checkoutId
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
      // Get next fridge number (as TEXT)
      const maxFridge = db.prepare('SELECT MAX(CAST(fridge_number AS INTEGER)) as max FROM fridges').get();
      const nextFridgeNumber = String((maxFridge.max || 0) + 1);

      // Insert new fridge
      const fridgeStmt = db.prepare(`
        INSERT INTO fridges
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

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        message: 'Fridge checked in successfully',
        fridgeId: fridgeResult.lastInsertRowid,
        fridgeNumber: nextFridgeNumber
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
      FROM fridges
      WHERE status = 'available'
    `;

    const params = [];
    if (has_freezer !== undefined) {
      query += ' AND has_freezer = ?';
      params.push(has_freezer === 'true' ? 1 : 0);
    }

    query += ' ORDER BY CAST(fridge_number AS INTEGER)';

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
      total: db.prepare('SELECT COUNT(*) as count FROM fridges').get().count,
      available: db.prepare('SELECT COUNT(*) as count FROM fridges WHERE status = ?').get('available').count,
      checkedOut: db.prepare('SELECT COUNT(*) as count FROM fridges WHERE status = ?').get('checked_out').count,
      maintenance: db.prepare('SELECT COUNT(*) as count FROM fridges WHERE status = ?').get('maintenance').count,
      overdue: 0  // No longer tracking expected_return_date in new structure
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

    let query = 'SELECT * FROM fridges';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY CAST(fridge_number AS INTEGER)';

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
      graduationYear,
      checkedOutBy
    } = req.body;

    db.prepare('BEGIN').run();

    try {
      // Get fridge details
      const fridge = db.prepare('SELECT fridge_number FROM fridges WHERE id = ?').get(fridgeId);

      if (!fridge) {
        db.prepare('ROLLBACK').run();
        return res.status(404).json({ error: 'Fridge not found' });
      }

      // Get current academic year range (e.g., "2025-2026")
      const now = new Date();
      const currentYear = now.getFullYear();
      const month = now.getMonth();
      const yearRange = month >= 7 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;

      // Create checkout record in checkouts table
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
        studentName,
        studentEmail,
        housingAssignment || '',
        graduationYear || '',
        yearRange,
        0  // Fridge checkouts don't need approval
      );

      // Create item record with fridge identifier
      db.prepare(`
        INSERT INTO items (
          checkout_id,
          item_name,
          item_quantity,
          year_range,
          verification_status
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        checkoutResult.lastInsertRowid,
        `Fridge #${fridge.fridge_number}`,
        1,
        yearRange,
        'pending'
      );

      // Update fridge status
      db.prepare(`
        UPDATE fridges
        SET status = 'checked_out'
        WHERE id = ?
      `).run(fridgeId);

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
// NOTE: This endpoint is deprecated - use POST /api/fridges/return instead
app.patch('/api/fridges/checkout/:id/return', (req, res) => {
  try {
    const checkoutId = parseInt(req.params.id);
    const { conditionAtReturn, notesReturn, checkedInBy } = req.body;

    db.prepare('BEGIN').run();

    try {
      // Find items in this checkout that are fridges
      const fridgeItems = db.prepare(`
        SELECT i.id as itemId, i.item_name
        FROM items i
        WHERE i.checkout_id = ?
          AND i.item_name LIKE 'Fridge #%'
          AND i.verification_status = 'pending'
      `).all(checkoutId);

      if (fridgeItems.length === 0) {
        db.prepare('ROLLBACK').run();
        return res.status(404).json({ error: 'No active fridge items found in this checkout' });
      }

      // Update each fridge item status
      fridgeItems.forEach(item => {
        // Extract fridge number from item name
        const fridgeNumber = item.item_name.replace('Fridge #', '');

        // Update item status to returned
        db.prepare('UPDATE items SET status = ?, return_date = CURRENT_TIMESTAMP WHERE id = ?')
          .run('returned', item.itemId);

        // Update fridge status and condition
        const needsMaintenance = conditionAtReturn === 'Needs Repair' || conditionAtReturn === 'Damaged' || conditionAtReturn === 'Poor';
        const newStatus = needsMaintenance ? 'maintenance' : 'available';

        // Update fridge with new condition and status
        const updateQuery = `
          UPDATE fridges
          SET status = ?, condition = ?, notes = ?
          WHERE fridge_number = ?
        `;

        const maintenanceNote = needsMaintenance
          ? `Returned in ${conditionAtReturn} condition. ${notesReturn || ''}. Needs maintenance.`
          : notesReturn || '';

        db.prepare(updateQuery).run(newStatus, conditionAtReturn || 'Good', maintenanceNote, fridgeNumber);
      });

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        checkoutId,
        itemsProcessed: fridgeItems.length
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
      SELECT id, fridge_number, has_freezer, size, color, brand, model, condition, status, notes
      FROM fridges
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

// Update fridge details
app.patch('/api/fridges/:id', (req, res) => {
  try {
    const fridgeId = parseInt(req.params.id);
    let { brand, model, size, color, condition, status, notes, performedBy } = req.body;

    // Get current fridge data
    const currentFridge = db.prepare('SELECT * FROM fridges WHERE id = ?').get(fridgeId);

    if (!currentFridge) {
      return res.status(404).json({ error: 'Fridge not found' });
    }

    // If condition is "Needs Repair" and fridge is not checked out, automatically set status to "maintenance"
    const needsMaintenance = condition === 'Needs Repair' || condition === 'Poor' || condition === 'Damaged';
    if (needsMaintenance && currentFridge.status !== 'checked_out') {
      status = 'maintenance';
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (brand !== undefined) {
      updates.push('brand = ?');
      params.push(brand);
    }
    if (model !== undefined) {
      updates.push('model = ?');
      params.push(model);
    }
    if (size !== undefined) {
      updates.push('size = ?');
      params.push(size);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    if (condition !== undefined) {
      updates.push('condition = ?');
      params.push(condition);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      // If setting to maintenance, append maintenance note
      if (needsMaintenance && status === 'maintenance') {
        const maintenanceNote = condition ? `Condition: ${condition}. ${notes || ''}. Needs maintenance.` : notes || 'Marked for maintenance';
        params.push(maintenanceNote);
      } else {
        params.push(notes);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(fridgeId);

    const query = `
      UPDATE fridges
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    const result = db.prepare(query).run(...params);

    res.json({ success: true, message: 'Fridge updated successfully' });

  } catch (error) {
    console.error('Error updating fridge:', error);
    res.status(500).json({ error: 'Failed to update fridge' });
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
            UPDATE fridges
            SET status = 'checked_out'
            WHERE id = ?
          `).run(item.fridgeId);
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
          COALESCE(ii.name, 'Fridge #' || f.fridge_number) as name,
          ii.sku,
          f.fridge_number,
          f.brand
        FROM checkout_items ci
        LEFT JOIN inventory_items ii ON ci.item_id = ii.id
        LEFT JOIN fridges f ON ci.fridge_id = f.id
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
    const searchPattern = `${q}%`; // Prefix search only

    // Search items table and aggregate by item_name
    // Include ALL items (approved, pending, flagged) for check-in
    // Exclude fridge records: items with fridge_company_id OR items named "Fridge" or "Fridge #X"
    const items = db.prepare(`
      SELECT
        item_name as name,
        COUNT(*) as available_quantity,
        'ITEM-' || SUBSTR(UPPER(item_name), 1, 3) || '-' || MIN(id) as sku,
        'Donation' as category,
        'item' as type
      FROM items
      WHERE item_name LIKE ?
        AND fridge_company_id IS NULL
        AND item_name NOT LIKE 'Fridge%'
      GROUP BY item_name
      HAVING COUNT(*) > 0
      ORDER BY item_name
      LIMIT 25
    `).all(searchPattern);

    // Add id field for each aggregated item
    const itemsWithId = items.map((item, index) => ({
      id: index + 2000, // Use different offset for check-in
      name: item.name,
      sku: item.sku,
      category: item.category,
      current_quantity: item.available_quantity,
      type: 'item'
    }));

    // Search fridges (note: table is 'fridges')
    const fridges = db.prepare(`
      SELECT
        id,
        fridge_number,
        brand,
        status,
        'fridge' as type
      FROM fridges
      WHERE CAST(fridge_number AS TEXT) LIKE ? OR brand LIKE ?
      LIMIT 25
    `).all(searchPattern, searchPattern);

    res.json([...itemsWithId, ...fridges]);
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
          const existingFridge = db.prepare('SELECT id, fridge_number FROM fridges WHERE id = ?').get(item.fridgeId);

          if (existingFridge) {
            // Returning an existing fridge
            db.prepare(`
              INSERT INTO checkin_items (checkin_id, fridge_id, quantity)
              VALUES (?, ?, 1)
            `).run(checkinId, item.fridgeId);

            // Update fridge status to available
            db.prepare(`
              UPDATE fridges
              SET status = 'available'
              WHERE id = ?
            `).run(item.fridgeId);
          } else {
            // New fridge being checked in - auto-generate fridge number
            const maxNumber = db.prepare('SELECT MAX(CAST(fridge_number AS INTEGER)) as max FROM fridges').get().max || 0;
            const newFridgeNumber = String(maxNumber + 1);

            const fridgeResult = db.prepare(`
              INSERT INTO fridges (fridge_number, has_freezer, brand, status, condition)
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
