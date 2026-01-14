import { useState, useEffect, useCallback } from 'react';
import { fridgeAPI } from '../services/api';

/**
 * Custom hook to fetch and manage fridge attribute options
 * @returns {Object} attributes, loading, error, refetch, add methods
 */
export function useFridgeAttributes() {
  const [attributes, setAttributes] = useState({
    brands: [],
    sizes: [],
    colors: [],
    conditions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttributes = useCallback(async () => {
    try {
      const data = await fridgeAPI.getAttributes();
      setAttributes(data);
    } catch (err) {
      console.error('Error fetching fridge attributes:', err);
      setError(err.message || 'Failed to load fridge attributes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const addSize = async (name, createdBy = 'worker@haverford.edu') => {
    const result = await fridgeAPI.addSize(name, createdBy);
    await fetchAttributes(); // Refresh attributes
    return result;
  };

  const addColor = async (name, createdBy = 'worker@haverford.edu') => {
    const result = await fridgeAPI.addColor(name, createdBy);
    await fetchAttributes(); // Refresh attributes
    return result;
  };

  const addBrand = async (name, createdBy = 'worker@haverford.edu') => {
    const result = await fridgeAPI.addBrand(name, createdBy);
    await fetchAttributes(); // Refresh attributes
    return result;
  };

  const addCondition = async (name, createdBy = 'worker@haverford.edu') => {
    const result = await fridgeAPI.addCondition(name, createdBy);
    await fetchAttributes(); // Refresh attributes
    return result;
  };

  return {
    attributes,
    loading,
    error,
    refetch: fetchAttributes,
    addSize,
    addColor,
    addBrand,
    addCondition
  };
}
