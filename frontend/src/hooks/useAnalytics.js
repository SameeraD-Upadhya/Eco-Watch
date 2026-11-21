import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useAnalytics = (refreshSignal = 0) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to load live analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, refreshSignal]);

  return { analytics, loading, error, refreshAnalytics: fetchAnalytics };
};
