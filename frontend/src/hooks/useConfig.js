import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useConfig = (refreshSignal = 0) => {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [enums, setEnums] = useState({ severities: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, locs, enm] = await Promise.all([
        api.getCategories(),
        api.getLocations(),
        api.getEnums()
      ]);
      setCategories(cats || []);
      setLocations(locs || []);
      setEnums(enm || { severities: [], statuses: [] });
    } catch (err) {
      setError(err.message || 'Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig, refreshSignal]);

  return { categories, locations, enums, loading, error, refreshConfig: fetchConfig };
};
