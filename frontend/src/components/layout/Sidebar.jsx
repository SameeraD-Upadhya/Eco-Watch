import React from 'react';
import { 
  LayoutDashboard, 
  Send, 
  ClipboardList, 
  Database, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Live Analytics', icon: LayoutDashboard, badgeKey: 'total' },
  { id: 'citizen', label: 'Citizen Portal', icon: Send },
  { id: 'tracker', label: 'Response Tracker', icon: ClipboardList, badgeKey: 'open' },
  { id: 'master', label: 'Master Data & Import', icon: Database },
];

export const Sidebar = ({ 
  currentTab, 
  setCurrentTab, 
  isCollapsed, 
  setIsCollapsed, 
  mobileOpen, 
  setMobileOpen,
  analytics
}) => {
  const openCount = analytics?.counts_by_status?.Open ?? 0;
  const totalCount = analytics?.total_reports ?? 0;

  const content = (
    <div className="flex flex-col h-full bg-sidebar border-r border-border-subtle select-none">
      {/* Brand Header */}
      <div className="h-12 flex items-center justify-between px-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-serif font-bold text-sm tracking-tight text-ink-primary">
            {(!isCollapsed || mobileOpen) ? 'EcoWatch' : 'EW'}
          </span>
          {(!isCollapsed || mobileOpen) && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-soft text-primary font-mono">
              Mysuru
            </span>
          )}
        </div>

        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-md text-text-muted hover:text-ink-primary hover:bg-primary-soft lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <div className={`px-2 mb-2 text-[10px] font-semibold tracking-wider text-text-muted uppercase font-mono ${isCollapsed && !mobileOpen ? 'text-center' : ''}`}>
          {isCollapsed && !mobileOpen ? '•••' : 'Navigation'}
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          let badgeVal = null;
          if (item.badgeKey === 'open' && openCount > 0) badgeVal = openCount;
          if (item.badgeKey === 'total' && totalCount > 0) badgeVal = totalCount;

          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                if (mobileOpen) setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-xs transition-all duration-150 relative ${
                isActive
                  ? 'border-l-2 border-primary bg-primary-soft text-primary font-medium pl-2'
                  : 'text-text-secondary hover:text-ink-primary hover:bg-sunken/60 font-normal'
              } ${isCollapsed && !mobileOpen ? 'justify-center px-1' : ''}`}
              title={isCollapsed && !mobileOpen ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 stroke-[1.75]" />
              {(!isCollapsed || mobileOpen) && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {(!isCollapsed || mobileOpen) && badgeVal !== null && (
                <span className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full font-mono ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : item.badgeKey === 'open' 
                      ? 'bg-status-open-soft text-status-open' 
                      : 'bg-primary-soft text-primary'
                }`}>
                  {badgeVal}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Rail Collapse Toggle */}
      <div className="p-2 border-t border-border-subtle bg-surface">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full hidden lg:flex items-center justify-center gap-1.5 p-1.5 rounded text-text-muted hover:text-ink-primary hover:bg-sunken transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
              <ChevronLeft className="w-4 h-4" /> 
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside 
        className={`hidden lg:block shrink-0 transition-all duration-200 z-20 ${
          isCollapsed ? 'w-[56px]' : 'w-[200px]'
        }`}
      >
        <div className="fixed top-0 bottom-0 left-0 h-full transition-all duration-200" style={{ width: isCollapsed ? 56 : 200 }}>
          {content}
        </div>
      </aside>

      {/* Mobile Overlay Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-ink-primary/30 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute top-0 bottom-0 left-0 w-[220px] bg-surface shadow-md z-10"
            >
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
