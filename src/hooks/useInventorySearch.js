import { useState, useCallback } from 'react';
import { inventoryAPI } from '../services/api';

/**
 * Custom hook for inventory item search
 * @returns {Object} items, loading, error, searchItems
 */
export function useInventorySearch() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search inventory items
  const searchItems = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);

    try {
      const data = await inventoryAPI.searchItems(query);
      setItems(data);
    } catch (err) {
      console.error('Error searching inventory:', err);
      setError(err.message || 'Failed to search inventory');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items,
    loading,
    error,
    searchItems
  };
}
