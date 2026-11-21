import React, { useState } from 'react';
import { Menu, Search, RefreshCw, Leaf, RotateCcw, HelpCircle, AlertTriangle } from 'lucide-react';
import { HeaderBadge } from './HeaderBadge';
import { Modal } from '../common/Modal';

export const Topbar = ({ 
  onMenuClick, 
  health, 
  healthLoading, 
  onRefresh, 
  isRefreshing,
  searchQuery,
  setSearchQuery,
  onResetDemo,
  isResettingDemo,
  onOpenTour
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleConfirmReset = async () => {
    setShowConfirmReset(false);
    if (onResetDemo) {
      await onResetDemo();
    }
  };

  return (
    <>
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

        {/* Right: Actions, Simulation Badge, and MongoDB Status Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Simulation Data Badge */}
          <span 
            className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold tracking-wide"
            title="Demonstration environment: authentic MCC boundary geometry with synthetic citizen records"
          >
            Simulation Data
          </span>

          {/* Quick Guided Tour Button */}
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              className="p-1.5 rounded-md text-text-secondary hover:text-ink-primary hover:bg-primary-soft transition-colors"
              title="Interactive System Walkthrough"
              aria-label="Walkthrough Tour"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Reset Demo State Button */}
          {onResetDemo && (
            <button
              onClick={() => setShowConfirmReset(true)}
              disabled={isResettingDemo}
              className="px-2 py-1 rounded text-[11px] font-medium text-text-secondary hover:text-ink-primary hover:bg-sunken border border-border-subtle transition-colors flex items-center gap-1 disabled:opacity-50"
              title="Reset demonstration data with dynamic 6-month timestamp rebasing"
            >
              <RotateCcw className={`w-3 h-3 ${isResettingDemo ? 'animate-spin text-accent' : ''}`} />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          )}

          {/* Refresh button */}
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

      {/* Confirmation Modal for Demo Reset */}
      <Modal
        isOpen={showConfirmReset}
        onClose={() => setShowConfirmReset(false)}
        title="Reset Demonstration State?"
        subtitle="Restore official Mysuru City Corporation 65-ward baseline"
        maxWidth="max-w-md"
      >
        <div className="space-y-3.5 text-xs">
          <div className="p-3 bg-accent-soft/40 border border-accent/30 rounded-md text-ink-primary space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-accent">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Confirm Demonstration Reset</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              This will reseed all 150 demonstration reports, restore the 65 official MCC wards,
              and dynamically rebase all historical timestamps relative to today's date within the past 6 months.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowConfirmReset(false)}
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-ink-primary hover:bg-sunken border border-border-subtle transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              disabled={isResettingDemo}
              className="px-3.5 py-1.5 rounded-md bg-accent hover:bg-accent/90 text-white font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isResettingDemo ? 'Resetting...' : 'Confirm Reset'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
