import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useReports = (filters = {}, refreshSignal = 0, initialPage = 1, initialPageSize = 20, sortBy = 'newest') => {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReports({ ...filters, sort_by: sortBy }, page, pageSize);
      if (data && Array.isArray(data.items)) {
        setReports(data.items);
        setTotal(data.total);
      } else if (Array.isArray(data)) {
        setReports(data);
        setTotal(data.length);
      } else {
        setReports([]);
        setTotal(0);
      }
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
    filters.search,
    sortBy,
    page,
    pageSize
  ]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, refreshSignal]);

  return { 
    reports, 
    total, 
    page, 
    pageSize, 
    setPage, 
    setPageSize, 
    loading, 
    error, 
    refreshReports: fetchReports 
  };
};
