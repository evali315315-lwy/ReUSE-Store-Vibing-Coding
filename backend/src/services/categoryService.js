import db from '../db/database.js';

/**
 * Category Service: Business logic for managing categories
 */

export const categoryService = {
  /**
   * Get all categories, sorted by times_used descending
   * @returns {Array} List of categories
   */
  getAllCategories() {
    const stmt = db.prepare(`
      SELECT id, name, times_used as timesUsed, created_at, created_by
      FROM categories
      ORDER BY times_used DESC, name ASC
    `);

    return stmt.all();
  },

  /**
   * Get category by ID
   * @param {number} id - Category ID
   * @returns {Object|null} Category object or null
   */
  getCategoryById(id) {
    const stmt = db.prepare(`
      SELECT id, name, times_used as timesUsed, created_at, created_by
      FROM categories
      WHERE id = ?
    `);

    return stmt.get(id);
  },

  /**
   * Get category by name (case-insensitive)
   * @param {string} name - Category name
   * @returns {Object|null} Category object or null
   */
  getCategoryByName(name) {
    const stmt = db.prepare(`
      SELECT id, name, times_used as timesUsed, created_at, created_by
      FROM categories
      WHERE LOWER(name) = LOWER(?)
    `);

    return stmt.get(name);
  },

  /**
   * Create new category
   * @param {string} name - Category name
   * @param {string} createdBy - Optional creator identifier
   * @returns {Object} Created category with ID
   */
  createCategory(name, createdBy = null) {
    const stmt = db.prepare(`
      INSERT INTO categories (name, created_by)
      VALUES (?, ?)
    `);

    const result = stmt.run(name, createdBy);

    return this.getCategoryById(result.lastInsertRowid);
  },

  /**
   * Increment category usage count
   * @param {number} id - Category ID
   */
  incrementUsage(id) {
    const stmt = db.prepare(`
      UPDATE categories
      SET times_used = times_used + 1
      WHERE id = ?
    `);

    stmt.run(id);
  },

  /**
   * Find or create category (used during product submission)
   * @param {string} name - Category name
   * @param {string} createdBy - Optional creator identifier
   * @returns {Object} Existing or newly created category
   */
  findOrCreateCategory(name, createdBy = null) {
    // Check if category exists (case-insensitive)
    const existing = this.getCategoryByName(name);

    if (existing) {
      return existing;
    }

    // Create new category
    return this.createCategory(name, createdBy);
  }
};
