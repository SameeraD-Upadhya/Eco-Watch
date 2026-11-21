import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface border border-border-subtle px-3 py-2 rounded-md shadow-md text-xs">
        <p className="font-semibold text-ink-primary font-serif">{data.category_name}</p>
        <p className="text-text-secondary font-mono mt-0.5">
          Reports: <span className="font-bold text-primary">{data.count}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const CategoryChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 h-76 flex flex-col items-center justify-center text-center">
        <p className="text-xs text-text-muted">No category reports recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 flex flex-col h-76">
      <div className="border-b border-border-subtle pb-2.5 mb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">Incidents by Category</h3>
          <p className="text-[11px] text-text-muted">Dynamic category color fills from MongoDB</p>
        </div>
        <span className="text-[11px] font-mono text-text-muted">{data.length} categories</span>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis 
              dataKey="category_name" 
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
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color_hex || '#2F5D46'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
