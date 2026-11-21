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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border-subtle p-2.5 rounded-md shadow-md text-xs space-y-1">
        <p className="font-semibold text-ink-primary font-serif border-b border-border-subtle pb-1">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 font-mono text-[11px]">
            <span style={{ color: item.color }} className="font-medium">{item.name}:</span>
            <span className="font-bold text-ink-primary">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const StackedStatusBarChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 h-76 flex flex-col items-center justify-center text-center">
        <p className="text-xs text-text-muted">No ward breakdown data recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 flex flex-col h-76">
      <div className="border-b border-border-subtle pb-2.5 mb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">Status Composition per Ward</h3>
          <p className="text-[11px] text-text-muted">Open, In Progress, and Resolved triage distribution</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-status-open" /> Open</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-status-progress" /> In Progress</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-status-resolved" /> Resolved</span>
        </div>
      </div>

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
    </div>
  );
};
