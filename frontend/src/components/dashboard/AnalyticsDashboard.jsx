import React from 'react';
import { HotspotBanner } from './HotspotBanner';
import { KpiStrip } from './KpiStrip';
import { DataInsightsPanel } from './DataInsightsPanel';
import { RecurrenceTable } from './RecurrenceTable';
import { HotspotMap } from './HotspotMap';
import { TrendChart } from './TrendChart';
import { PerformancePanel } from './PerformancePanel';
import { WardRankings } from './WardRankings';
import { CategoryChart } from './CategoryChart';
import { StatusDistribution } from './StatusDistribution';
import { LocalityDonut } from './LocalityDonut';
import { StackedStatusBarChart } from './StackedStatusBarChart';
import { AlertCircle, RefreshCw, PlusCircle, Database } from 'lucide-react';

export const AnalyticsDashboard = ({ 
  analytics, 
  loading, 
  error, 
  onRefresh, 
  onNavigateToCitizen, 
  onNavigateToMaster,
  onSelectWard
}) => {
  if (loading && !analytics) {
    return (
      <div className="space-y-5">
        <div className="h-12 bg-surface border border-border-subtle rounded-md animate-pulse" />
        <div className="h-24 bg-surface border border-border-subtle rounded-md animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-[320px] bg-surface border border-border-subtle rounded-md animate-pulse" />
          <div className="h-[320px] bg-surface border border-border-subtle rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-md border border-status-open/30 bg-status-open-soft text-center max-w-lg mx-auto my-8">
        <AlertCircle className="w-7 h-7 text-status-open mx-auto mb-2" />
        <h3 className="text-sm font-semibold font-serif text-status-open">Unable to Load Live Analytics</h3>
        <p className="text-xs text-text-secondary mt-1 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-status-open text-white text-xs font-semibold shadow-sm"
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

      {/* 2. Automated Executive Insights Panel with Print Action */}
      <DataInsightsPanel insights={analytics?.data_insights} />

      {/* 3. Primary KPI Strip */}
      <KpiStrip analytics={analytics} />

      {/* 4. Empty DB Callout if zero records */}
      {!hasData ? (
        <div className="p-10 rounded-md border border-dashed border-border-strong bg-surface text-center shadow-sm">
          <Database className="w-8 h-8 text-text-muted mx-auto mb-2.5" />
          <h3 className="text-sm font-semibold font-serif text-ink-primary">Database Empty: No Reports Recorded</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            All charts, KPIs, and hotspot alerts operate strictly on live MongoDB records with zero hardcoded defaults. Submit observations or import historical datasets to populate analytics.
          </p>
          <div className="flex items-center justify-center gap-2.5">
            <button
              onClick={onNavigateToCitizen}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit Observation</span>
            </button>
            <button
              onClick={onNavigateToMaster}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sunken hover:bg-surface border border-border-subtle text-ink-primary text-xs font-semibold transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Master Data & Ingest</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 5. Recurrence Ranking Table */}
          <section>
            <RecurrenceTable recurrences={analytics?.top_recurrences} />
          </section>

          {/* 6. Geospatial Hotspot Map */}
          <section>
            <HotspotMap wardPoints={analytics?.ward_map_points} />
          </section>

          {/* 7. Reporting Intake Trends & Seasonality */}
          <section>
            <TrendChart 
              weeklyData={analytics?.time_trend_weekly} 
              monthlyData={analytics?.time_trend_monthly} 
              onNavigateToCitizen={onNavigateToCitizen}
            />
          </section>

          {/* 8. Incident Category & Status Distribution */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <CategoryChart 
                data={analytics?.counts_by_category} 
                totalReports={analytics?.total_reports}
                onNavigateToCitizen={onNavigateToCitizen}
              />
            </div>
            <div>
              <StatusDistribution 
                countsByStatus={analytics?.counts_by_status} 
                totalReports={analytics?.total_reports}
                resolutionRate={analytics?.resolution_rate}
                onNavigateToCitizen={onNavigateToCitizen}
              />
            </div>
          </section>

          {/* 9. Remediation Performance & Civic SLA Compliance */}
          <section>
            <PerformancePanel 
              zonePerformances={analytics?.zone_performances}
              categoryPerformances={analytics?.category_performances}
              authorityCompliances={analytics?.authority_compliances}
              oldestUnresolved={analytics?.oldest_unresolved_reports}
              avgTurnaround={analytics?.average_turnaround_hours}
              medianTurnaround={analytics?.median_turnaround_hours}
              reopenRate={analytics?.reopen_rate}
              resolutionRate={analytics?.resolution_rate}
            />
          </section>

          {/* 10. Ward Load & Administrative Zone Lag */}
          <section>
            <WardRankings 
              topWards={analytics?.top_wards_by_volume}
              bottomZones={analytics?.bottom_zones_by_resolution}
              totalReports={analytics?.total_reports}
              onSelectWard={onSelectWard}
            />
          </section>

          {/* 11. Stacked Status per Ward */}
          <section>
            <StackedStatusBarChart 
              data={analytics?.stacked_status_per_location} 
              onNavigateToCitizen={onNavigateToCitizen}
            />
          </section>
        </div>
      )}
    </div>
  );
};
