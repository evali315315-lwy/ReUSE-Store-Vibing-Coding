import axios from 'axios';

/**
 * API Service Layer
 * Provides unified interface for both Google Sheets and SQLite backends
 */

const USE_NEW_BACKEND = import.meta.env.VITE_USE_NEW_BACKEND === 'true';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

/**
 * Donor API
 */
export const donorAPI = {
  /**
   * Search donors by name or email
   * @param {string} query - Search query
   * @returns {Promise<Array>} List of donors
   */
  async searchDonors(query = '') {
    if (USE_NEW_BACKEND) {
      const response = await axios.get(`${API_URL}/donors/search`, {
        params: { q: query }
      });
      return response.data;
    } else {
      const response = await axios.get(`${APPS_SCRIPT_URL}?action=search-donors&query=${query}`);
      return response.data;
    }
  },

  /**
   * Get donor by ID
   * @param {number} id - Donor ID
   * @returns {Promise<Object>} Donor object
   */
  async getDonorById(id) {
    if (USE_NEW_BACKEND) {
      const response = await axios.get(`${API_URL}/donors/${id}`);
      return response.data;
    } else {
      throw new Error('getDonorById not supported with Google Sheets backend');
    }
  },

  /**
   * Create new donor
   * @param {Object} donorData - Donor information
   * @returns {Promise<Object>} Created donor
   */
  async createDonor(donorData) {
    if (USE_NEW_BACKEND) {
      const response = await axios.post(`${API_URL}/donors`, donorData);
      return response.data;
    } else {
      throw new Error('createDonor not supported with Google Sheets backend');
    }
  }
};

/**
 * Category API
 */
export const categoryAPI = {
  /**
   * Get all categories
   * @returns {Promise<Array>} List of categories
   */
  async getCategories() {
    if (USE_NEW_BACKEND) {
      const response = await axios.get(`${API_URL}/categories`);
      return response.data;
    } else {
      const response = await axios.get(`${APPS_SCRIPT_URL}?action=get-categories`);
      return response.data;
    }
  },

  /**
   * Create new category
   * @param {string} name - Category name
   * @param {string} createdBy - Optional creator
   * @returns {Promise<Object>} Created category
   */
  async createCategory(name, createdBy = null) {
    if (USE_NEW_BACKEND) {
      const response = await axios.post(`${API_URL}/categories`, {
        name,
        createdBy
      });
      return response.data;
    } else {
      const response = await axios.post(APPS_SCRIPT_URL, {
        action: 'create-category',
        name,
        createdBy
      });
      return response.data;
    }
  }
};

/**
 * Photo Upload API
 */
export const photoAPI = {
  /**
   * Upload photo to Google Drive
   * @param {File} file - Image file
   * @returns {Promise<string>} Photo URL
   */
  async uploadPhoto(file) {
    if (USE_NEW_BACKEND) {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.url;
    } else {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('action', 'upload-photo');

      const response = await axios.post(APPS_SCRIPT_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.url;
    }
  }
};

/**
 * Product API
 */
export const productAPI = {
  /**
   * Submit new product
   * @param {Object} productData - Product information
   * @returns {Promise<Object>} Created product
   */
  async submitProduct(productData) {
    if (USE_NEW_BACKEND) {
      const response = await axios.post(`${API_URL}/products`, {
        donorName: productData.ownerName,
        email: productData.email,
        housing: productData.housingAssignment,
        gradYear: productData.graduationYear,
        categoryName: productData.category,
        description: productData.itemDescription,
        photoUrl: productData.photoUrl
      });

      return response.data;
    } else {
      const response = await axios.post(APPS_SCRIPT_URL, {
        action: 'submit-product',
        ...productData
      });

      return response.data;
    }
  },

  /**
   * Get all products (paginated)
   * @param {number} limit - Number of products per page
   * @param {number} offset - Pagination offset
   * @returns {Promise<Array>} List of products
   */
  async getProducts(limit = 50, offset = 0) {
    if (USE_NEW_BACKEND) {
      const response = await axios.get(`${API_URL}/products`, {
        params: { limit, offset }
      });
      return response.data;
    } else {
      throw new Error('getProducts not supported with Google Sheets backend');
    }
  },

  /**
   * Get product by ID
   * @param {number} id - Product ID
   * @returns {Promise<Object>} Product details
   */
  async getProductById(id) {
    if (USE_NEW_BACKEND) {
      const response = await axios.get(`${API_URL}/products/${id}`);
      return response.data;
    } else {
      throw new Error('getProductById not supported with Google Sheets backend');
    }
  }
};

/**
 * Import API (new backend only)
 */
export const importAPI = {
  /**
   * Preview donors from CSV file without importing
   * @param {File} file - CSV file
   * @returns {Promise<Object>} Preview data with validation results
   */
  async previewDonors(file) {
    if (!USE_NEW_BACKEND) {
      throw new Error('Import functionality requires new backend');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/import/donors/preview`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  },

  /**
   * Import donors from CSV file
   * @param {File} file - CSV file
   * @returns {Promise<Object>} Import results
   */
  async importDonors(file) {
    if (!USE_NEW_BACKEND) {
      throw new Error('Import functionality requires new backend');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/import/donors`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }
};

/**
 * Health check (new backend only)
 */
export const healthAPI = {
  async checkHealth() {
    if (USE_NEW_BACKEND) {
      const response = await axios.get(`${API_URL.replace('/api', '')}/health`);
      return response.data;
    }
    return { status: 'ok', backend: 'google-sheets' };
  }
};
