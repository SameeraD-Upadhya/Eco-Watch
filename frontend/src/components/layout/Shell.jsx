import React, { useState } from 'react';
import { Sidebar, NAV_ITEMS } from './Sidebar';
import { Topbar } from './Topbar';

export const Shell = ({ 
  children, 
  currentTab, 
  setCurrentTab, 
  health, 
  healthLoading, 
  onRefresh, 
  isRefreshing,
  searchQuery,
  setSearchQuery,
  analytics
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink-primary pb-20 sm:pb-0 overflow-x-hidden">
      <div className="flex-1 flex">
        {/* Desktop Sidebar & Mobile Drawer */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          analytics={analytics}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            onMenuClick={() => setMobileOpen(true)}
            health={health}
            healthLoading={healthLoading}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (<640px) */}
      <nav className="fixed bottom-0 left-0 right-0 z-mobile-nav bg-surface border-t border-border-subtle flex sm:hidden items-center justify-around h-13 px-2 shadow-sm">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="mt-0.5 truncate max-w-[70px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
