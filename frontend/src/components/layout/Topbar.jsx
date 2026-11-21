import React from 'react';
import { Menu, Search, RefreshCw, Leaf } from 'lucide-react';
import { HeaderBadge } from './HeaderBadge';

export const Topbar = ({ 
  onMenuClick, 
  health, 
  healthLoading, 
  onRefresh, 
  isRefreshing,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <header className="h-12 sticky top-0 z-header bg-surface/95 backdrop-blur-xs border-b border-border-subtle px-2.5 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left: Mobile Toggle & Brand / Subtitle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-md text-text-secondary hover:text-ink-primary hover:bg-primary-soft lg:hidden shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Leaf className="w-4 h-4 text-primary shrink-0" />
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-sm tracking-tight text-ink-primary">
              EcoWatch
            </span>
            <span className="text-xs text-text-muted hidden sm:inline-block font-sans border-l border-border-subtle pl-2">
              Mysuru Civic Environmental Monitor
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="relative w-full max-w-xs hidden md:block">
        <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search reports, citizens, wards..."
          className="w-full pl-8 pr-8 py-1 text-xs bg-sunken/60 focus:bg-surface border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-all text-ink-primary placeholder:text-text-muted"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-muted border border-border-subtle rounded px-1 bg-surface hidden lg:inline-block">
          /
        </kbd>
      </div>

      {/* Right: Refresh button and MongoDB Status Badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-md text-text-secondary hover:text-ink-primary hover:bg-primary-soft transition-colors disabled:opacity-50"
          title="Refresh live data from MongoDB"
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
        </button>

        <HeaderBadge health={health} loading={healthLoading} />
      </div>
    </header>
  );
};
