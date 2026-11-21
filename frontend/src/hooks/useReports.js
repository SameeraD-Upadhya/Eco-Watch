import { useState, useEffect } from 'react';
import { api } from '../services/api';

/**
 * Controlled useReports hook for EcoWatch
 * Accepts controlled page, pageSize, and sortBy from App.jsx
 * Prevents race conditions with active state cancellation.
 */
export const useReports = (
  filters = {},
  refreshSignal = 0,
  page = 1,
  pageSize = 20,
  sortBy = 'newest'
) => {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function fetchReports() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getReports(
          { ...filters, sort_by: sortBy },
          page,
          pageSize
        );

        if (active) {
          if (data && Array.isArray(data.items)) {
            setReports(data.items);
            setTotal(data.total || 0);
          } else if (Array.isArray(data)) {
            setReports(data);
            setTotal(data.length);
          } else {
            setReports([]);
            setTotal(0);
          }
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load reports');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchReports();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    filters.status,
    filters.category_name,
    filters.location_name,
    filters.severity,
    filters.search,
    sortBy,
    page,
    pageSize,
    refreshSignal
  ]);

  return {
    reports,
    total,
    loading,
    error
  };
};
