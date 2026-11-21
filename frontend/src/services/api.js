const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

class ApiError extends Error {
  constructor(message, code = 'API_ERROR', details = null, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = options.headers || {};

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, { ...options, headers });
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : {};
    }

    if (!res.ok) {
      const errInfo = data?.error || {};
      throw new ApiError(
        errInfo.message || data.message || `Request failed with status ${res.status}`,
        errInfo.code || `HTTP_${res.status}`,
        errInfo.details || null,
        res.status
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network connection failed', 'NETWORK_ERROR', null, 0);
  }
}

export const api = {
  // System Health & Enums
  getHealth: () => request('/health'),
  getEnums: () => request('/config/enums'),

  // Categories Master Data
  getCategories: () => request('/config/categories'),
  createCategory: (payload) => request('/config/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Locations / Wards Master Data
  getLocations: () => request('/config/locations'),
  createLocation: (payload) => request('/config/locations', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Reports
  getReports: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category_name) params.append('category_name', filters.category_name);
    if (filters.location_name) params.append('location_name', filters.location_name);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.search) params.append('search', filters.search);
    const qs = params.toString();
    return request(`/reports${qs ? `?${qs}` : ''}`);
  },
  createReport: (payload) => request('/reports', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateReportStatus: (reportNo, payload) => request(`/reports/${reportNo}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),
  deleteReport: (reportNo) => request(`/reports/${reportNo}`, {
    method: 'DELETE'
  }),
  bulkImportReports: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/reports/bulk-import', {
      method: 'POST',
      body: formData
    });
  },

  // Analytics
  getAnalytics: () => request('/analytics')
};
