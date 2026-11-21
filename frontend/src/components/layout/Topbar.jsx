import React from 'react';
import { Menu, Sun, Moon, Search, RefreshCw, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../theme';
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
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-primary-soft lg:hidden shrink-0"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search input with shortcut hint */}
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports, citizens, wards..."
            className="w-full pl-9 pr-10 py-1.5 text-xs bg-app/60 focus:bg-surface border border-border-subtle rounded-pill focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-text-primary placeholder:text-text-muted"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-muted border border-border-subtle rounded px-1.5 py-0.5 bg-surface hidden md:inline-block">
            /
          </kbd>
        </div>
      </div>

      {/* Right: MongoDB Status Badge, Refresh, Theme Toggle, User Block */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Refresh Trigger */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-primary-soft transition-colors disabled:opacity-50"
          title="Refresh live data from MongoDB"
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>

        {/* MongoDB Status Badge */}
        <HeaderBadge health={health} loading={healthLoading} />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-primary-soft transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Academic / User ID Pill */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border-subtle">
          <div className="w-7 h-7 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">
            SU
          </div>
          <div className="text-left hidden xl:block">
            <p className="text-xs font-semibold text-text-primary leading-none"></p>
            <p className="text-[10px] text-text-muted font-mono leading-tight"></p>
          </div>
        </div>
      </div>
    </header>
  );
};
