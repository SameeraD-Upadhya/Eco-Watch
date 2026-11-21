import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Sparkles } from 'lucide-react';
import { ChartFrame } from '../common/ChartFrame';

const CustomTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc, curr) => acc + (curr.value || 0), 0);
    return (
      <div className="bg-surface border border-border-subtle p-2.5 rounded-md shadow-md text-xs space-y-1">
        <p className="font-semibold font-serif text-ink-primary border-b border-border-subtle pb-1">
          {label} (IST Timeline)
        </p>
        <div className="space-y-0.5 font-mono text-[11px]">
          {payload.map((entry) => (
            <div key={entry.name} className="flex justify-between gap-3">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <strong className="text-ink-primary">{entry.value}</strong>
            </div>
          ))}
          <div className="border-t border-border-subtle pt-1 mt-1 flex justify-between font-bold text-ink-primary">
            <span>Total Intake:</span>
            <span>{total}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const TrendChart = ({ weeklyData = [], monthlyData = [], onNavigateToCitizen }) => {
  const [viewMode, setViewMode] = useState('weekly');

  const activeData = viewMode === 'weekly' ? weeklyData : monthlyData;
  const hasData = activeData && activeData.length > 0;

  const toggleAction = (
    <div className="flex items-center gap-1 bg-sunken p-0.5 rounded border border-border-subtle text-xs font-medium">
      <button
        onClick={() => setViewMode('weekly')}
        className={`px-2 py-0.5 rounded transition-colors ${
          viewMode === 'weekly'
            ? 'bg-surface text-ink-primary font-semibold shadow-xs'
            : 'text-text-secondary hover:text-ink-primary'
        }`}
      >
        Weekly
      </button>
      <button
        onClick={() => setViewMode('monthly')}
        className={`px-2 py-0.5 rounded transition-colors ${
          viewMode === 'monthly'
            ? 'bg-surface text-ink-primary font-semibold shadow-xs'
            : 'text-text-secondary hover:text-ink-primary'
        }`}
      >
        Monthly
      </button>
    </div>
  );

  return (
    <ChartFrame
      title="Reporting Velocity & Seasonality"
      subtitle="Incident intake timeline categorized by remediation status"
      action={toggleAction}
      hasData={hasData}
      emptyMessage="No time-series reports recorded yet."
      emptyActionText="Lodge Observation"
      onEmptyAction={onNavigateToCitizen}
      heightClass="h-[340px]"
    >
      <div className="flex-1 w-full min-h-0 flex flex-col justify-between">
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                iconSize={8}
              />
              <Bar dataKey="Open" stackId="a" fill="var(--status-open)" />
              <Bar dataKey="In Progress" stackId="a" fill="var(--status-progress)" />
              <Bar dataKey="Resolved" stackId="a" fill="var(--status-resolved)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {viewMode === 'monthly' && (
          <div className="mt-2 pt-2 border-t border-border-subtle flex items-center gap-2 text-[11px] text-text-secondary shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>
              <strong>Dasara Festival Seasonality:</strong> October exhibits peak municipal waste volume and public nuisance reports around the central CBD and heritage parade routes.
            </span>
          </div>
        )}
      </div>
    </ChartFrame>
  );
};
