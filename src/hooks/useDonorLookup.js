import { useState, useEffect } from 'react';
import { donorAPI } from '../services/api';

function useDonorLookup() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async (query = '') => {
    setLoading(true);
    setError(null);

    try {
      const data = await donorAPI.searchDonors(query);
      console.log('Donors fetched:', data.length, 'donors');
      setDonors(data);
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError(err.message || 'Failed to load donors');
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  const searchDonors = (query) => {
    if (!query) return donors;

    const lowerQuery = query.toLowerCase();
    return donors.filter(
      donor =>
        donor.name.toLowerCase().includes(lowerQuery) ||
        donor.email.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    donors,
    loading,
    error,
    searchDonors,
    refetch: fetchDonors
  };
}

export default useDonorLookup;
