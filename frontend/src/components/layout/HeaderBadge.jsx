import React from 'react';
import { Database, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export const HeaderBadge = ({ health, loading }) => {
  if (loading && !health) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-pill bg-primary-soft text-text-muted text-xs border border-border-subtle animate-pulse">
        <span className="w-2 h-2 rounded-full bg-text-muted"></span>
        <span className="font-mono">Connecting...</span>
      </div>
    );
  }

  const isConnected = health?.connected;
  const isHealthy = health?.status === 'healthy';

  let statusColor = 'bg-status-open text-status-open';
  let badgeBorder = 'border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400';
  let label = 'MongoDB: Disconnected';
  let Icon = XCircle;

  if (isConnected && isHealthy) {
    statusColor = 'bg-status-resolved text-status-resolved';
    badgeBorder = 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400';
    label = `eco_monitor (${health?.collection_counts?.reports ?? 0} reports)`;
    Icon = CheckCircle2;
  } else if (isConnected && !isHealthy) {
    statusColor = 'bg-status-progress text-status-progress';
    badgeBorder = 'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400';
    label = 'MongoDB: Degraded';
    Icon = AlertTriangle;
  }

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-medium border ${badgeBorder} transition-colors`}
      title={isConnected ? `Database: ${health.database} | Reports: ${health.collection_counts?.reports ?? 0}` : 'Cannot connect to MongoDB localhost:27017'}
    >
      <Database className="w-3.5 h-3.5" />
      <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current"></span>
      <span className="font-medium tracking-tight truncate max-w-[160px] sm:max-w-none">{label}</span>
    </div>
  );
};
