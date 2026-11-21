import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './theme';
import { Shell } from './components/layout/Shell';
import { api } from './services/api';
import { useConfig } from './hooks/useConfig';
import { useReports } from './hooks/useReports';
import { useAnalytics } from './hooks/useAnalytics';

import { CitizenForm } from './components/citizen/CitizenForm';
import { MasterDataManager } from './components/master/MasterDataManager';
import { ResponseTracker } from './components/tracker/ResponseTracker';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';

// Simple Toast Container
export const ToastContext = React.createContext({ addToast: () => {} });

export function AppContent() {
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (['dashboard', 'citizen', 'tracker', 'master'].includes(tab)) return tab;
    }
    return 'dashboard';
  });
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category_name: '',
    location_name: '',
    severity: '',
    search: ''
  });
  const [toasts, setToasts] = useState([]);
  
  // MongoDB Health polling
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync Topbar search query into filter
  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
  }, [searchQuery]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshSignal((prev) => prev + 1);
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch {
      setHealth({ connected: false, status: 'offline', collection_counts: {} });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Poll health on mount and every 12 seconds
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const h = await api.getHealth();
        if (mounted) {
          setHealth(h);
          setHealthLoading(false);
        }
      } catch {
        if (mounted) {
          setHealth({ connected: false, status: 'offline', collection_counts: {} });
          setHealthLoading(false);
        }
      }
    };
    check();
    const interval = setInterval(check, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshSignal]);

  // Data hooks
  const { categories, locations, enums, refreshConfig } = useConfig(refreshSignal);
  const { analytics, loading: analyticsLoading, refreshAnalytics } = useAnalytics(refreshSignal);
  const { reports, loading: reportsLoading, refreshReports } = useReports(filters, refreshSignal);

  const handleAllRefresh = () => {
    triggerRefresh();
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <Shell
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        health={health}
        healthLoading={healthLoading}
        onRefresh={handleAllRefresh}
        isRefreshing={isRefreshing}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        analytics={analytics}
      >
        {/* Render Active View */}
        <div className="space-y-6">
          {currentTab === 'dashboard' && (
            <AnalyticsDashboard
              analytics={analytics}
              loading={analyticsLoading}
              error={null}
              onRefresh={handleAllRefresh}
              onNavigateToCitizen={() => setCurrentTab('citizen')}
              onNavigateToMaster={() => setCurrentTab('master')}
            />
          )}

          {currentTab === 'citizen' && (
            <div className="space-y-6">
              <div className="border-b border-border-subtle pb-4">
                <h1 className="text-xl font-bold tracking-tight text-text-primary">Citizen Observation Portal</h1>
                <p className="text-xs text-text-secondary mt-1">
                  Submit localized environmental alerts, hazards, and civic maintenance requests.
                </p>
              </div>

              <CitizenForm
                categories={categories}
                locations={locations}
                enums={enums}
                onSuccess={(newRep) => {
                  addToast(`Report #${newRep.report_no} lodged successfully`);
                  handleAllRefresh();
                  setCurrentTab('tracker');
                }}
                onNavigateToMaster={() => setCurrentTab('master')}
              />
            </div>
          )}

          {currentTab === 'tracker' && (
            <ResponseTracker
              reports={reports}
              categories={categories}
              locations={locations}
              enums={enums}
              filters={filters}
              setFilters={setFilters}
              loading={reportsLoading}
              onRefresh={handleAllRefresh}
              addToast={addToast}
              onNavigateToCitizen={() => setCurrentTab('citizen')}
            />
          )}

          {currentTab === 'master' && (
            <MasterDataManager
              categories={categories}
              locations={locations}
              onRefresh={handleAllRefresh}
              addToast={addToast}
            />
          )}
        </div>

        {/* Global Toast Notifications */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto px-4 py-3 rounded-md shadow-e2 text-xs font-medium border flex items-center gap-2.5 transition-all ${
                toast.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
              }`}
            >
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </Shell>
    </ToastContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
