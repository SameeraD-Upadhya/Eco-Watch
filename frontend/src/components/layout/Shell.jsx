import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
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
    <div className="min-h-screen flex bg-app text-text-primary transition-colors duration-150">
      {/* Sidebar (Desktop & Mobile Drawer) */}
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
