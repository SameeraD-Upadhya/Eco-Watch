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
import { ChartFrame } from '../common/ChartFrame';

const CustomTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const pct = total > 0 ? ((data.count / total) * 100).toFixed(1) : '0.0';
    return (
      <div className="bg-surface border border-border-subtle px-3 py-2 rounded-md shadow-md text-xs">
        <p className="font-semibold text-ink-primary font-serif">{data.category_name}</p>
        <p className="text-text-secondary font-mono mt-0.5">
          Reports: <span className="font-bold text-ink-primary">{data.count}</span> ({pct}%)
        </p>
      </div>
    );
  }
  return null;
};

export const CategoryChart = ({ data = [], totalReports = 0, onNavigateToCitizen }) => {
  const hasData = data && data.length > 0;
  const total = totalReports || data.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <ChartFrame
      title="Incidents by Category"
      subtitle="Horizontal ranking: dynamic palette fills from MongoDB"
      badge={`${data.length} categories`}
      hasData={hasData}
      emptyMessage="No category incidents recorded yet."
      emptyActionText="Lodge Observation"
      onEmptyAction={onNavigateToCitizen}
      heightClass="h-[320px]"
    >
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            layout="vertical" 
            data={data} 
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
            <XAxis 
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            />
            <YAxis 
              type="category"
              dataKey="category_name" 
              width={145}
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
            />
            <Tooltip content={<CustomTooltip total={total} />} />
            <Bar 
              dataKey="count" 
              radius={[0, 3, 3, 0]}
              label={{
                position: 'right',
                formatter: (val) => {
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                  return `${val} (${pct}%)`;
                },
                fontSize: 10,
                fill: 'var(--text-muted)'
              }}
            >
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
    </ChartFrame>
  );
};
