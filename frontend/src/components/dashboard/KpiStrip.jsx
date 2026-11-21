import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, CheckCircle2, BarChart2 } from 'lucide-react';

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    const duration = 500;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span className="tabular-nums">{displayValue}</span>;
};

export const KpiStrip = ({ analytics }) => {
  const total = analytics?.total_reports ?? 0;
  const open = analytics?.counts_by_status?.Open ?? 0;
  const progress = analytics?.counts_by_status?.['In Progress'] ?? 0;
  const resolved = analytics?.counts_by_status?.Resolved ?? 0;
  const resolutionRate = analytics?.resolution_rate ?? 0.0;
  const avgResponses = analytics?.average_responses_per_report ?? 0.0;
  const avgTurnaround = analytics?.average_turnaround_hours;

  return (
    <div className="space-y-3">
      {/* 4 Divided Primary Cells */}
      <div className="bg-surface border border-border-subtle rounded-md shadow-sm grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle overflow-hidden">
        {/* Cell 1: Total Reports */}
        <div className="p-4 sm:p-4.5">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 font-mono">
            <span>Total Reports</span>
            <BarChart2 className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-ink-primary tracking-tight">
            <AnimatedNumber value={total} />
          </div>
          <div className="text-[11px] text-text-muted mt-1 font-mono">
            Monitored municipal wards
          </div>
        </div>

        {/* Cell 2: Open Issues */}
        <div className="p-4 sm:p-4.5">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 font-mono">
            <span>Open Issues</span>
            <AlertCircle className="w-3.5 h-3.5 text-status-open" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-status-open tracking-tight">
            <AnimatedNumber value={open} />
          </div>
          <div className="text-[11px] text-text-muted mt-1 font-mono">
            Awaiting remediation dispatch
          </div>
        </div>

        {/* Cell 3: In Progress */}
        <div className="p-4 sm:p-4.5">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 font-mono">
            <span>In Progress</span>
            <Clock className="w-3.5 h-3.5 text-status-progress" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-status-progress tracking-tight">
            <AnimatedNumber value={progress} />
          </div>
          <div className="text-[11px] text-text-muted mt-1 font-mono">
            Active field remediation
          </div>
        </div>

        {/* Cell 4: Resolved + Rate % */}
        <div className="p-4 sm:p-4.5">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 font-mono">
            <span>Resolved</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-status-resolved" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-status-resolved tracking-tight">
              <AnimatedNumber value={resolved} />
            </div>
            <span className="text-xs font-semibold text-status-resolved font-mono">
              ({resolutionRate}%)
            </span>
          </div>
          <div className="text-[11px] text-text-muted mt-1 font-mono">
            Resolution rate to date
          </div>
        </div>
      </div>

      {/* Auxiliary Operational Metrics Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-md bg-sunken/50 border border-border-subtle text-xs text-text-secondary flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>
            Avg Responses / Report: <strong className="font-mono text-ink-primary">{avgResponses}</strong>
          </span>
          <span className="text-border-strong">•</span>
          <span>
            Avg Turnaround: <strong className="font-mono text-ink-primary">{avgTurnaround !== null ? `${avgTurnaround} hrs` : 'N/A'}</strong>
          </span>
        </div>
        <span className="text-[10px] text-text-muted font-mono uppercase">
          Dynamic MongoDB Aggregations
        </span>
      </div>
    </div>
  );
};
