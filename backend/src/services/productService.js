import db from '../db/database.js';
import { donorService } from './donorService.js';
import { categoryService } from './categoryService.js';

/**
 * Product Service: Business logic for managing products
 */

export const productService = {
  /**
   * Get all products with pagination
   * @param {number} limit - Number of products per page
   * @param {number} offset - Offset for pagination
   * @returns {Array} List of products with donor and category info
   */
  getAllProducts(limit = 50, offset = 0) {
    const stmt = db.prepare(`
      SELECT
        p.id,
        p.description,
        p.photo_url as photoUrl,
        p.date_logged as dateLogged,
        d.id as donorId,
        d.name as donorName,
        d.email as donorEmail,
        c.id as categoryId,
        c.name as categoryName
      FROM products p
      JOIN donors d ON p.donor_id = d.id
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.date_logged DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(limit, offset);
  },

  /**
   * Get product by ID
   * @param {number} id - Product ID
   * @returns {Object|null} Product with full details
   */
  getProductById(id) {
    const stmt = db.prepare(`
      SELECT
        p.id,
        p.description,
        p.photo_url as photoUrl,
        p.date_logged as dateLogged,
        p.created_at as createdAt,
        d.id as donorId,
        d.name as donorName,
        d.email as donorEmail,
        d.housing as donorHousing,
        d.grad_year as donorGradYear,
        c.id as categoryId,
        c.name as categoryName
      FROM products p
      JOIN donors d ON p.donor_id = d.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `);

    return stmt.get(id);
  },

  /**
   * Create new product
   * Handles donor and category creation if needed
   * @param {Object} productData - Product information
   * @returns {Object} Created product with full details
   */
  createProduct(productData) {
    // Handle donor - find or create
    let donorId;

    if (productData.donorId) {
      donorId = productData.donorId;
    } else {
      // Create or find donor
      const donor = donorService.findOrCreateDonor({
        name: productData.donorName,
        email: productData.email,
        housing: productData.housing,
        gradYear: productData.gradYear
      });
      donorId = donor.id;
    }

    // Handle category - find or create
    let categoryId;

    if (productData.categoryId) {
      categoryId = productData.categoryId;
    } else {
      // Create or find category
      const category = categoryService.findOrCreateCategory(
        productData.categoryName,
        productData.createdBy
      );
      categoryId = category.id;
    }

    // Insert product
    const stmt = db.prepare(`
      INSERT INTO products (donor_id, category_id, description, photo_url)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      donorId,
      categoryId,
      productData.description,
      productData.photoUrl || null
    );

    // Increment category usage
    categoryService.incrementUsage(categoryId);

    // Return created product with full details
    return this.getProductById(result.lastInsertRowid);
  },

  /**
   * Get products by donor ID
   * @param {number} donorId - Donor ID
   * @returns {Array} List of products
   */
  getProductsByDonor(donorId) {
    const stmt = db.prepare(`
      SELECT
        p.id,
        p.description,
        p.photo_url as photoUrl,
        p.date_logged as dateLogged,
        c.name as categoryName
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.donor_id = ?
      ORDER BY p.date_logged DESC
    `);

    return stmt.all(donorId);
  },

  /**
   * Get products by category ID
   * @param {number} categoryId - Category ID
   * @returns {Array} List of products
   */
  getProductsByCategory(categoryId) {
    const stmt = db.prepare(`
      SELECT
        p.id,
        p.description,
        p.photo_url as photoUrl,
        p.date_logged as dateLogged,
        d.name as donorName
      FROM products p
      JOIN donors d ON p.donor_id = d.id
      WHERE p.category_id = ?
      ORDER BY p.date_logged DESC
    `);

    return stmt.all(categoryId);
  }
};
