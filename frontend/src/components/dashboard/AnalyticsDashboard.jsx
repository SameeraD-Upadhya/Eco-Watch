import React from 'react';
import { HotspotBanner } from './HotspotBanner';
import { KpiStrip } from './KpiStrip';
import { CategoryChart } from './CategoryChart';
import { LocalityDonut } from './LocalityDonut';
import { StackedStatusBarChart } from './StackedStatusBarChart';
import { AlertCircle, RefreshCw, PlusCircle, Database } from 'lucide-react';

export const AnalyticsDashboard = ({ 
  analytics, 
  loading, 
  error, 
  onRefresh, 
  onNavigateToCitizen, 
  onNavigateToMaster 
}) => {
  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-surface border border-border-subtle rounded-lg animate-pulse" />
        <div className="h-28 bg-surface border border-border-subtle rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-surface border border-border-subtle rounded-lg animate-pulse lg:col-span-2" />
          <div className="h-80 bg-surface border border-border-subtle rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-center max-w-lg mx-auto my-8">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-200">Unable to Load Live Analytics</h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const hasData = analytics?.total_reports > 0;

  return (
    <div className="space-y-6">
      {/* 1. Hotspot Banner */}
      <HotspotBanner hotspot={analytics?.hotspot} />

      {/* 2. KPI Strip */}
      <KpiStrip analytics={analytics} />

      {/* 3. Empty DB Callout if zero records */}
      {!hasData ? (
        <div className="p-12 rounded-lg border-2 border-dashed border-border-strong bg-surface text-center">
          <Database className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-text-primary">Database Empty: No Reports Recorded</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto mt-1 mb-5 leading-relaxed">
            All charts, KPIs, and hotspot alerts operate strictly on live MongoDB records with zero hardcoded defaults. Submit observations or import historical datasets to populate analytics.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onNavigateToCitizen}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit Observation</span>
            </button>
            <button
              onClick={onNavigateToMaster}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-app hover:bg-surface border border-border-subtle text-text-primary text-xs font-semibold"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Master Data & Ingest</span>
            </button>
          </div>
        </div>
      ) : (
        /* 4. Three Recharts Views with ResponsiveContainer */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category BarChart - 2 column span */}
            <div className="lg:col-span-2">
              <CategoryChart data={analytics?.counts_by_category} />
            </div>

            {/* Locality Donut - 1 column span */}
            <div className="lg:col-span-1">
              <LocalityDonut 
                data={analytics?.counts_by_location} 
                total={analytics?.total_reports} 
              />
            </div>
          </div>

          {/* Stacked Status per Ward - Full width */}
          <StackedStatusBarChart data={analytics?.stacked_status_per_location} />
        </div>
      )}
    </div>
  );
};
