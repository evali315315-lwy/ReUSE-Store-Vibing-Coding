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

/**
 * Student API (Check-In/Check-Out System)
 */
export const studentAPI = {
  /**
   * Search students by name or email
   * @param {string} query - Search query
   * @param {boolean} withFridgesOnly - Only return students with active fridge checkouts
   * @returns {Promise<Array>} List of students
   */
  async searchStudents(query = '', withFridgesOnly = false) {
    const response = await axios.get(`${API_URL}/students/search`, {
      params: {
        q: query,
        withFridgesOnly: withFridgesOnly ? 'true' : 'false'
      }
    });
    return response.data;
  },

  /**
   * Get student by email
   * @param {string} email - Student email
   * @returns {Promise<Object>} Student object
   */
  async getStudentByEmail(email) {
    const response = await axios.get(`${API_URL}/students/${email}`);
    return response.data;
  },

  /**
   * Create or update student
   * @param {Object} studentData - Student information
   * @returns {Promise<Object>} Created/updated student
   */
  async createOrUpdateStudent(studentData) {
    const response = await axios.post(`${API_URL}/students`, studentData);
    return response.data;
  }
};

/**
 * Inventory API (Check-In/Check-Out System)
 */
export const inventoryAPI = {
  /**
   * Search inventory items
   * @param {string} query - Search query
   * @returns {Promise<Array>} List of inventory items
   */
  async searchItems(query = '') {
    const response = await axios.get(`${API_URL}/inventory/search`, {
      params: { q: query }
    });
    return response.data;
  },

  /**
   * Get all inventory items (admin only)
   * @returns {Promise<Array>} All inventory items
   */
  async getAllItems() {
    const response = await axios.get(`${API_URL}/inventory`);
    return response.data;
  },

  /**
   * Create new inventory item (admin only)
   * @param {Object} itemData - Item information
   * @returns {Promise<Object>} Created item
   */
  async createItem(itemData) {
    const response = await axios.post(`${API_URL}/inventory`, itemData);
    return response.data;
  }
};

/**
 * Fridge API (Check-In/Check-Out System)
 */
export const fridgeAPI = {
  /**
   * Get fridge attribute options for dropdowns (from dynamic tables)
   * @returns {Promise<Object>} Brands, sizes, colors, conditions
   */
  async getAttributes() {
    const response = await axios.get(`${API_URL}/fridges/attributes`);
    return response.data;
  },

  /**
   * Add new fridge size (workers and admins can add)
   * @param {string} name - Size name
   * @param {string} createdBy - User who created it
   * @returns {Promise<Object>} Created size
   */
  async addSize(name, createdBy) {
    const response = await axios.post(`${API_URL}/fridges/attributes/sizes`, { name, createdBy });
    return response.data;
  },

  /**
   * Add new fridge color (workers and admins can add)
   * @param {string} name - Color name
   * @param {string} createdBy - User who created it
   * @returns {Promise<Object>} Created color
   */
  async addColor(name, createdBy) {
    const response = await axios.post(`${API_URL}/fridges/attributes/colors`, { name, createdBy });
    return response.data;
  },

  /**
   * Add new fridge brand (workers and admins can add)
   * @param {string} name - Brand name
   * @param {string} createdBy - User who created it
   * @returns {Promise<Object>} Created brand
   */
  async addBrand(name, createdBy) {
    const response = await axios.post(`${API_URL}/fridges/attributes/brands`, { name, createdBy });
    return response.data;
  },

  /**
   * Add new fridge condition (workers and admins can add)
   * @param {string} name - Condition name
   * @param {string} createdBy - User who created it
   * @returns {Promise<Object>} Created condition
   */
  async addCondition(name, createdBy) {
    const response = await axios.post(`${API_URL}/fridges/attributes/conditions`, { name, createdBy });
    return response.data;
  },

  /**
   * Get student's active fridge checkouts
   * @param {string} email - Student email
   * @returns {Promise<Array>} Active fridge checkouts
   */
  async getStudentCheckouts(email) {
    const response = await axios.get(`${API_URL}/fridges/checkouts/${email}`);
    return response.data;
  },

  /**
   * Return a fridge
   * @param {Object} data - { fridgeId, studentEmail, returnedBy }
   * @returns {Promise<Object>} Return confirmation
   */
  async returnFridge(data) {
    const response = await axios.post(`${API_URL}/fridges/return`, data);
    return response.data;
  },

  /**
   * Check in a NEW fridge to inventory
   * @param {Object} data - { hasFreezer, size, color, brand, condition, notes, checkedInBy }
   * @returns {Promise<Object>} Checkin confirmation with fridge number
   */
  async checkinFridge(data) {
    const response = await axios.post(`${API_URL}/fridges/checkin`, data);
    return response.data;
  },

  /**
   * Search available fridges
   * @param {boolean} hasFreezer - Filter by freezer type
   * @returns {Promise<Array>} Available fridges
   */
  async getAvailableFridges(hasFreezer) {
    const response = await axios.get(`${API_URL}/fridges/available`, {
      params: hasFreezer !== undefined ? { has_freezer: hasFreezer } : {}
    });
    return response.data;
  },

  /**
   * Get fridge by number
   * @param {number} number - Fridge number
   * @returns {Promise<Object>} Fridge details
   */
  async getFridgeByNumber(number) {
    const response = await axios.get(`${API_URL}/fridges/${number}`);
    return response.data;
  },

  /**
   * Create new fridge (admin only)
   * @param {Object} fridgeData - Fridge information
   * @returns {Promise<Object>} Created fridge
   */
  async createFridge(fridgeData) {
    const response = await axios.post(`${API_URL}/fridges`, fridgeData);
    return response.data;
  }
};

/**
 * Checkout API (Check-Out System)
 */
export const checkoutAPI = {
  /**
   * Create checkout transaction
   * @param {Object} checkoutData - Checkout information
   * @returns {Promise<Object>} Checkout result
   */
  async createCheckout(checkoutData) {
    const response = await axios.post(`${API_URL}/checkouts-out`, checkoutData);
    return response.data;
  },

  /**
   * Get active checkouts
   * @returns {Promise<Array>} Active checkouts
   */
  async getActiveCheckouts() {
    const response = await axios.get(`${API_URL}/checkouts-out/active`);
    return response.data;
  }
};

/**
 * Checkin API (Check-In System)
 */
export const checkinAPI = {
  /**
   * Search items/fridges for check-in
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async searchForCheckin(query = '') {
    const response = await axios.get(`${API_URL}/checkins/search`, {
      params: { q: query }
    });
    return response.data;
  },

  /**
   * Create checkin transaction
   * @param {Object} checkinData - Checkin information
   * @returns {Promise<Object>} Checkin result
   */
  async createCheckin(checkinData) {
    const response = await axios.post(`${API_URL}/checkins`, checkinData);
    return response.data;
  }
};
