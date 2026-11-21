import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ChartFrame } from '../common/ChartFrame';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc, curr) => acc + (curr.value || 0), 0);
    return (
      <div className="bg-surface border border-border-subtle p-2.5 rounded-md shadow-md text-xs space-y-1">
        <p className="font-semibold text-ink-primary font-serif border-b border-border-subtle pb-1">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 font-mono text-[11px]">
            <span style={{ color: item.color }} className="font-medium">{item.name}:</span>
            <span className="font-bold text-ink-primary">{item.value}</span>
          </div>
        ))}
        <div className="border-t border-border-subtle pt-1 mt-1 flex justify-between font-mono text-[11px] font-bold text-ink-primary">
          <span>Total:</span>
          <span>{total}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const StackedStatusBarChart = ({ data = [], onNavigateToCitizen }) => {
  const hasData = data && data.length > 0;

  const legendBadges = (
    <div className="flex items-center gap-3 text-[11px] font-mono">
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-open)' }} /> Open</span>
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-progress)' }} /> In Progress</span>
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-resolved)' }} /> Resolved</span>
    </div>
  );

  return (
    <ChartFrame
      title="Status Composition per Ward"
      subtitle="Open, In Progress, and Resolved triage distribution"
      action={legendBadges}
      hasData={hasData}
      emptyMessage="No ward breakdown data recorded yet."
      emptyActionText="Lodge Observation"
      onEmptyAction={onNavigateToCitizen}
      heightClass="h-[320px]"
    >
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis 
              dataKey="location_name" 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Open" stackId="a" fill="var(--status-open)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="In Progress" stackId="a" fill="var(--status-progress)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Resolved" stackId="a" fill="var(--status-resolved)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
};
