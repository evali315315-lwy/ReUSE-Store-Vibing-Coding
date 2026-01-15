import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Settings API Service
 * Provides methods to fetch and update About page settings
 */
export const settingsAPI = {
  /**
   * Get all settings
   * @returns {Promise<Array>} List of all settings
   */
  async getSettings() {
    const response = await axios.get(`${API_URL}/settings`);
    return response.data;
  },

  /**
   * Get specific setting by key
   * @param {string} key - Setting key (e.g., 'hours', 'location', 'contact_email')
   * @returns {Promise<Object>} Setting object
   */
  async getSetting(key) {
    const response = await axios.get(`${API_URL}/settings/${key}`);
    return response.data;
  },

  /**
   * Update specific setting
   * @param {string} key - Setting key
   * @param {any} value - New value (will be JSON stringified on backend)
   * @param {string} updatedBy - Email or name of person making the update
   * @returns {Promise<Object>} Updated setting object
   */
  async updateSetting(key, value, updatedBy = 'admin') {
    const response = await axios.patch(`${API_URL}/settings/${key}`, {
      value,
      updated_by: updatedBy
    });
    return response.data;
  }
};

export default settingsAPI;
