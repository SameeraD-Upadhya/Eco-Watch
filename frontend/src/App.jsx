import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff } from 'lucide-react';
import { Shell } from './components/layout/Shell';
import { api } from './services/api';
import { useConfig } from './hooks/useConfig';
import { useReports } from './hooks/useReports';
import { useAnalytics } from './hooks/useAnalytics';

import { CitizenForm } from './components/citizen/CitizenForm';
import { MasterDataManager } from './components/master/MasterDataManager';
import { ResponseTracker } from './components/tracker/ResponseTracker';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';

// Toast Notification Context
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
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  
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

  // Synchronize offline queued reports
  const syncOfflineReports = useCallback(async () => {
    try {
      const offlineQueueKey = 'ecowatch_offline_reports';
      const queue = JSON.parse(localStorage.getItem(offlineQueueKey) || '[]');
      if (queue.length === 0) return;

      let syncedCount = 0;
      const remaining = [];
      for (const item of queue) {
        try {
          const { queued_at, offline_id, ...payload } = item;
          await api.createReport(payload);
          syncedCount++;
        } catch {
          remaining.push(item);
        }
      }
      localStorage.setItem(offlineQueueKey, JSON.stringify(remaining));
      if (syncedCount > 0) {
        addToast(`Synchronized ${syncedCount} offline report${syncedCount > 1 ? 's' : ''} with municipal server`);
        triggerRefresh();
      }
    } catch (err) {
      console.warn('Offline sync attempt failed:', err);
    }
  }, [addToast, triggerRefresh]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineReports();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      syncOfflineReports();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineReports]);

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
  const { categories, locations, enums } = useConfig(refreshSignal);
  const { analytics, loading: analyticsLoading } = useAnalytics(refreshSignal);
  const { reports, loading: reportsLoading } = useReports(filters, refreshSignal);

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
        {/* Offline Connectivity Notification Banner */}
        {!isOnline && (
          <div className="mb-4 px-4 py-2.5 rounded-md bg-status-medium-soft text-status-medium border border-status-medium/30 flex items-center gap-2.5 text-xs font-medium">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              You are currently offline. New reports will be queued locally and transmitted automatically when connectivity is restored.
            </span>
          </div>
        )}

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
                <h1 className="text-xl font-bold tracking-tight text-ink-primary font-serif">Citizen Observation Portal</h1>
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
              className={`pointer-events-auto px-4 py-3 rounded-md shadow-md text-xs font-medium border flex items-center gap-2.5 transition-all ${
                toast.type === 'error'
                  ? 'bg-status-open-soft text-status-open border-status-open/30'
                  : 'bg-status-resolved-soft text-status-resolved border-status-resolved/30'
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
  return <AppContent />;
}
