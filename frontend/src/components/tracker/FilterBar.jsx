import React from 'react';
import { Search, Filter, X, RefreshCw } from 'lucide-react';

export const FilterBar = ({ 
  filters, 
  setFilters, 
  categories = [], 
  locations = [], 
  enums = {}, 
  totalResults = 0 
}) => {
  const statuses = enums.statuses?.length ? enums.statuses : ['Open', 'In Progress', 'Resolved'];
  const severities = enums.severities?.length ? enums.severities : ['Low', 'Medium', 'High'];

  const hasActiveFilters = Boolean(
    filters.status || 
    filters.category_name || 
    filters.location_name || 
    filters.severity || 
    filters.search
  );

  const clearAll = () => {
    setFilters({
      status: '',
      category_name: '',
      location_name: '',
      severity: '',
      search: ''
    });
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-lg shadow-e1 p-4 space-y-3">
      {/* Search and Dropdowns Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search citizen, description, report #..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-app rounded-md border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-2.5 py-1.5 text-xs bg-app rounded-md border border-border-subtle text-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={filters.category_name || ''}
          onChange={(e) => setFilters({ ...filters, category_name: e.target.value })}
          className="px-2.5 py-1.5 text-xs bg-app rounded-md border border-border-subtle text-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[160px] truncate"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Ward Filter */}
        <select
          value={filters.location_name || ''}
          onChange={(e) => setFilters({ ...filters, location_name: e.target.value })}
          className="px-2.5 py-1.5 text-xs bg-app rounded-md border border-border-subtle text-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[160px] truncate"
        >
          <option value="">All Wards ({locations.length})</option>
          {locations.map((l) => (
            <option key={l.id} value={l.ward_name}>{l.ward_name}</option>
          ))}
        </select>

        {/* Severity Filter */}
        <select
          value={filters.severity || ''}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          className="px-2.5 py-1.5 text-xs bg-app rounded-md border border-border-subtle text-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Severities</option>
          {severities.map((sev) => (
            <option key={sev} value={sev}>{sev}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips & Results Count */}
      <div className="flex items-center justify-between text-xs text-text-secondary pt-1 border-t border-border-subtle flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Filtered:</span>
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-primary-soft text-text-primary text-[11px] font-medium border border-border-subtle">
              Status: {filters.status}
              <button onClick={() => setFilters({ ...filters, status: '' })}><X className="w-3 h-3 hover:text-rose-500" /></button>
            </span>
          )}
          {filters.category_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-primary-soft text-text-primary text-[11px] font-medium border border-border-subtle">
              Category: {filters.category_name}
              <button onClick={() => setFilters({ ...filters, category_name: '' })}><X className="w-3 h-3 hover:text-rose-500" /></button>
            </span>
          )}
          {filters.location_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-primary-soft text-text-primary text-[11px] font-medium border border-border-subtle">
              Ward: {filters.location_name}
              <button onClick={() => setFilters({ ...filters, location_name: '' })}><X className="w-3 h-3 hover:text-rose-500" /></button>
            </span>
          )}
          {filters.severity && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-primary-soft text-text-primary text-[11px] font-medium border border-border-subtle">
              Severity: {filters.severity}
              <button onClick={() => setFilters({ ...filters, severity: '' })}><X className="w-3 h-3 hover:text-rose-500" /></button>
            </span>
          )}
        </div>

        <div className="font-mono text-[11px] font-medium">
          Showing <span className="font-bold text-text-primary">{totalResults}</span> reports
        </div>
      </div>
    </div>
  );
};
