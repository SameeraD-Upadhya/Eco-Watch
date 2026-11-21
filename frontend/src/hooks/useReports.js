import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useReports = (filters = {}, refreshSignal = 0) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReports(filters);
      setReports(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [
    filters.status, 
    filters.category_name, 
    filters.location_name, 
    filters.severity, 
    filters.search
  ]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, refreshSignal]);

  return { reports, loading, error, refreshReports: fetchReports };
};
