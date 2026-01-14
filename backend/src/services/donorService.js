import db from '../db/database.js';

/**
 * Donor Service: Business logic for managing donors
 */

export const donorService = {
  /**
   * Search donors by name or email (case-insensitive)
   * @param {string} query - Search query
   * @returns {Array} List of matching donors
   */
  searchDonors(query = '') {
    const searchTerm = `%${query}%`;

    const stmt = db.prepare(`
      SELECT id, name, email, housing, grad_year as gradYear
      FROM donors
      WHERE name LIKE ? COLLATE NOCASE
         OR email LIKE ? COLLATE NOCASE
      ORDER BY name ASC
      LIMIT 50
    `);

    return stmt.all(searchTerm, searchTerm);
  },

  /**
   * Get donor by ID
   * @param {number} id - Donor ID
   * @returns {Object|null} Donor object or null
   */
  getDonorById(id) {
    const stmt = db.prepare(`
      SELECT id, name, email, housing, grad_year as gradYear, created_at, updated_at
      FROM donors
      WHERE id = ?
    `);

    return stmt.get(id);
  },

  /**
   * Get donor by email (case-insensitive)
   * @param {string} email - Donor email
   * @returns {Object|null} Donor object or null
   */
  getDonorByEmail(email) {
    const stmt = db.prepare(`
      SELECT id, name, email, housing, grad_year as gradYear, created_at, updated_at
      FROM donors
      WHERE LOWER(email) = LOWER(?)
    `);

    return stmt.get(email);
  },

  /**
   * Create new donor
   * @param {Object} donor - Donor data { name, email, housing?, gradYear? }
   * @returns {Object} Created donor with ID
   */
  createDonor(donor) {
    const stmt = db.prepare(`
      INSERT INTO donors (name, email, housing, grad_year)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      donor.name,
      donor.email.toLowerCase(),
      donor.housing || null,
      donor.gradYear || null
    );

    return this.getDonorById(result.lastInsertRowid);
  },

  /**
   * Update donor information
   * @param {number} id - Donor ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated donor
   */
  updateDonor(id, updates) {
    const stmt = db.prepare(`
      UPDATE donors
      SET name = ?,
          housing = ?,
          grad_year = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      updates.name,
      updates.housing || null,
      updates.gradYear || null,
      id
    );

    return this.getDonorById(id);
  },

  /**
   * Find or create donor (used during product submission)
   * @param {Object} donorData - Donor information
   * @returns {Object} Existing or newly created donor
   */
  findOrCreateDonor(donorData) {
    // Check if donor exists by email
    const existing = this.getDonorByEmail(donorData.email);

    if (existing) {
      return existing;
    }

    // Create new donor
    return this.createDonor(donorData);
  }
};
