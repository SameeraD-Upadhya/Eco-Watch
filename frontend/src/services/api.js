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
      const errObj = data?.error || (typeof data?.detail === 'object' && data.detail !== null ? data.detail : null);
      const msg = errObj?.message || (typeof data?.detail === 'string' ? data.detail : null) || data?.message || `Request failed with status ${res.status}`;
      const code = errObj?.code || `HTTP_${res.status}`;
      const details = errObj?.details || null;
      throw new ApiError(msg, code, details, res.status);
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
  // System Health & Enums & App Config
  getHealth: () => request('/health'),
  getEnums: () => request('/config/enums'),
  getAppConfig: () => request('/config/app'),

  // Authorities Master Data
  getAuthorities: () => request('/config/authorities'),

  // Categories Master Data
  getCategories: () => request('/config/categories'),
  createCategory: (payload) => request('/config/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Locations / Wards Master Data
  getLocations: () => request('/config/locations'),
  getLandmarks: () => request('/config/landmarks'),
  createLocation: (payload) => request('/config/locations', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Master Data & Demonstration Loader
  loadMasterData: (includeSamples = true) => request(`/config/load-master?include_samples=${includeSamples}`, {
    method: 'POST'
  }),

  // Reports
  getReports: (filters = {}, page = 1, pageSize = 50) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category_name) params.append('category_name', filters.category_name);
    if (filters.location_name) params.append('location_name', filters.location_name);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.search) params.append('search', filters.search);
    if (page) params.append('page', page);
    if (pageSize) params.append('page_size', pageSize);
    const qs = params.toString();
    return request(`/reports${qs ? `?${qs}` : ''}`);
  },
  getReportByNo: (reportNo) => request(`/reports/${reportNo}`),
  getSimilarReports: (ward, category) => {
    const params = new URLSearchParams({ ward, category });
    return request(`/reports/similar?${params.toString()}`);
  },
  createReport: (payload) => request('/reports', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  corroborateReport: (reportNo, payload = {}) => request(`/reports/${reportNo}/corroborate`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  resetDemoData: () => request('/config/reset-demo', {
    method: 'POST'
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
  exportReports: (format = 'json') => request(`/reports/export?format=${format}`),

  // Analytics
  getAnalytics: () => request('/analytics')
};
