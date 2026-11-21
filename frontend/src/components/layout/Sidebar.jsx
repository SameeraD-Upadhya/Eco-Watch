import React from 'react';
import { 
  LayoutDashboard, 
  Send, 
  ClipboardList, 
  Database, 
  ChevronLeft, 
  ChevronRight,
  Leaf,
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
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Leaf className="w-5 h-5 text-emerald-50" />
          </div>
          {(!isCollapsed || mobileOpen) && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col min-w-0"
            >
              <span className="font-semibold text-sm tracking-tight text-text-primary leading-tight flex items-center gap-1.5">
                EcoWatch
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-soft text-primary">
                  Mysuru
                </span>
              </span>
              <span className="text-[11px] text-text-muted truncate">Civic Environmental Monitor</span>
            </motion.div>
          )}
        </div>

        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-primary-soft lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className={`px-2 mb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase ${isCollapsed && !mobileOpen ? 'text-center' : ''}`}>
          {isCollapsed && !mobileOpen ? '•••' : 'MONITORING VIEWS'}
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 relative ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-primary-soft'
              } ${isCollapsed && !mobileOpen ? 'justify-center px-2' : ''}`}
              title={isCollapsed && !mobileOpen ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 stroke-[1.75]" />
              {(!isCollapsed || mobileOpen) && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {(!isCollapsed || mobileOpen) && badgeVal !== null && (
                <span className={`text-[11px] tabular-nums font-semibold px-2 py-0.5 rounded-pill ${
                  isActive 
                    ? 'bg-emerald-700/80 text-white' 
                    : item.badgeKey === 'open' 
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                }`}>
                  {badgeVal}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Academic Info & Collapse Toggle */}
      <div className="p-3 border-t border-border-subtle bg-surface/50">
        {(!isCollapsed || mobileOpen) ? (
          <div className="p-2.5 rounded-md bg-primary-soft/60 border border-border-subtle/50 mb-2">
            <p className="text-[10px] font-bold text-text-muted tracking-wider uppercase">CAPSTONE PROJECT</p>
            <p className="text-xs font-semibold text-text-primary truncate"></p>
            <p className="text-[11px] text-text-secondary font-mono"></p>
          </div>
        ) : null}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full hidden lg:flex items-center justify-center gap-2 p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-primary-soft transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-2 text-xs font-medium"><ChevronLeft className="w-4 h-4" /> <span>Collapse</span></div>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside 
        className={`hidden lg:block shrink-0 transition-all duration-200 z-20 ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        <div className="fixed top-0 bottom-0 left-0 h-full transition-all duration-200" style={{ width: isCollapsed ? 72 : 260 }}>
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute top-0 bottom-0 left-0 w-[270px] bg-surface shadow-2xl z-10"
            >
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
