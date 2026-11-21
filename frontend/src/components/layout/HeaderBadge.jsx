import React from 'react';
import { Database, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export const HeaderBadge = ({ health, loading }) => {
  if (loading && !health) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-soft text-text-muted text-xs border border-border-subtle animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
        <span className="font-mono text-[11px]">Connecting...</span>
      </div>
    );
  }

  const isConnected = health?.connected;
  const isHealthy = health?.status === 'healthy';

  let badgeClasses = 'border-status-open/30 bg-status-open-soft text-status-open';
  let label = 'MongoDB: Disconnected';
  let Icon = XCircle;

  if (isConnected && isHealthy) {
    badgeClasses = 'border-status-resolved/30 bg-status-resolved-soft text-status-resolved';
    label = `eco_monitor (${health?.collection_counts?.reports ?? 0})`;
    Icon = CheckCircle2;
  } else if (isConnected && !isHealthy) {
    badgeClasses = 'border-status-progress/30 bg-status-progress-soft text-status-progress';
    label = 'MongoDB: Degraded';
    Icon = AlertTriangle;
  }

  return (
    <div 
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${badgeClasses} transition-colors`}
      title={isConnected ? `Database: ${health.database} | Reports: ${health.collection_counts?.reports ?? 0}` : 'Cannot connect to MongoDB localhost:27017'}
    >
      <Database className="w-3 h-3 shrink-0" />
      <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current shrink-0"></span>
      <span className="font-mono truncate max-w-[140px] sm:max-w-none">{label}</span>
    </div>
  );
};
