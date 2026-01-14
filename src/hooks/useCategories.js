import { useState, useEffect } from 'react';
import { categoryAPI } from '../services/api';
import toast from 'react-hot-toast';

function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await categoryAPI.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryName, workerEmail = 'worker@haverford.edu') => {
    // Check if category already exists (case-insensitive)
    const exists = categories.find(
      cat => cat.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (exists) {
      toast.error('Category already exists');
      return { success: false, error: 'Category already exists' };
    }

    try {
      const newCategory = await categoryAPI.createCategory(categoryName, workerEmail);
      setCategories([...categories, newCategory]);
      toast.success(`Category "${categoryName}" created!`);
      return { success: true, category: newCategory };
    } catch (err) {
      console.error('Error creating category:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create category';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  return {
    categories,
    loading,
    error,
    createCategory,
    refetch: fetchCategories
  };
}

export default useCategories;
