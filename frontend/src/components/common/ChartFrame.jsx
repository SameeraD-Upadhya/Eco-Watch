import React from 'react';
import { Database, PlusCircle } from 'lucide-react';

/**
 * ChartFrame: Unified responsive container for all EcoWatch charts and visual metrics.
 * Ensures an explicit non-zero height, overflow-visible for tooltips, and polite empty states.
 */
export const ChartFrame = ({
  title,
  subtitle,
  badge,
  action,
  children,
  hasData = true,
  emptyMessage = 'No incident data recorded yet.',
  emptyActionText,
  onEmptyAction,
  heightClass = 'h-[320px]',
  className = ''
}) => {
  return (
    <div className={`bg-surface border border-border-subtle rounded-md shadow-sm p-4 flex flex-col ${heightClass} ${className} overflow-visible`}>
      {/* Chart Header */}
      <div className="border-b border-border-subtle pb-2.5 mb-2.5 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div>
          {title && (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[11px] text-text-muted">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[11px] font-mono text-text-muted">
              {badge}
            </span>
          )}
          {action}
        </div>
      </div>

      {/* Main Chart Body / Polite Zero State */}
      <div className="flex-1 w-full min-h-0 min-w-0 relative flex flex-col">
        {!hasData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2">
            <div className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center text-text-muted">
              <Database className="w-5 h-5" />
            </div>
            <p className="text-xs text-text-muted max-w-xs leading-relaxed">
              {emptyMessage}
            </p>
            {emptyActionText && onEmptyAction && (
              <button
                type="button"
                onClick={onEmptyAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors mt-1 shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{emptyActionText}</span>
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
