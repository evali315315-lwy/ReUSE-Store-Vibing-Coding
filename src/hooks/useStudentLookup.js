import { useState, useEffect, useCallback } from 'react';
import { studentAPI } from '../services/api';

/**
 * Custom hook for student lookup with search functionality
 * @returns {Object} students, loading, error, searchStudents, refetch
 */
export function useStudentLookup() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch students with search query
  const searchStudents = useCallback(async (query = '', withFridgesOnly = false) => {
    setLoading(true);
    setError(null);

    try {
      const data = await studentAPI.searchStudents(query, withFridgesOnly);
      setStudents(data);
    } catch (err) {
      console.error('Error searching students:', err);
      setError(err.message || 'Failed to search students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    searchStudents('');
  }, [searchStudents]);

  // Refetch function
  const refetch = useCallback(() => {
    searchStudents('');
  }, [searchStudents]);

  return {
    students,
    loading,
    error,
    searchStudents,
    refetch
  };
}
