import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ChartFrame } from '../common/ChartFrame';

const STATUS_CONFIG = [
  { key: 'Open', label: 'Open', color: 'var(--status-open)' },
  { key: 'In Progress', label: 'In Progress', color: 'var(--status-progress)' },
  { key: 'Resolved', label: 'Resolved', color: 'var(--status-resolved)' }
];

const CustomStatusTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
    return (
      <div className="bg-surface border border-border-subtle px-3 py-2 rounded-md shadow-md text-xs space-y-0.5">
        <div className="flex items-center gap-1.5 font-semibold text-ink-primary font-serif">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span>{data.name}</span>
        </div>
        <p className="text-text-secondary font-mono text-[11px]">
          Count: <strong className="text-ink-primary">{data.value}</strong> ({pct}%)
        </p>
      </div>
    );
  }
  return null;
};

export const StatusDistribution = ({ 
  countsByStatus = {}, 
  totalReports = 0,
  resolutionRate = 0,
  onNavigateToCitizen
}) => {
  const chartData = STATUS_CONFIG.map((cfg) => ({
    name: cfg.label,
    value: countsByStatus[cfg.key] || 0,
    color: cfg.color
  }));

  const hasData = totalReports > 0;

  return (
    <ChartFrame
      title="Status Distribution"
      subtitle="Triage breakdown & resolution ratio"
      badge={`${resolutionRate}% resolved`}
      hasData={hasData}
      emptyMessage="No incidents lodged to show status distribution."
      emptyActionText="Lodge Observation"
      onEmptyAction={onNavigateToCitizen}
      heightClass="h-[320px]"
    >
      <div className="flex-1 w-full min-h-0 relative flex flex-col justify-between">
        <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomStatusTooltip total={totalReports} />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Donut Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold tabular-nums text-ink-primary font-serif">
              {totalReports}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-text-muted font-semibold font-mono">
              Total Reports
            </span>
          </div>
        </div>

        {/* Responsive Wrap Legend */}
        <div className="pt-2 border-t border-border-subtle flex items-center justify-around flex-wrap gap-2 text-xs">
          {chartData.map((item) => {
            const pct = totalReports > 0 ? Math.round((item.value / totalReports) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-text-secondary">{item.name}:</span>
                <strong className="text-ink-primary">{item.value}</strong>
                <span className="text-text-muted">({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </ChartFrame>
  );
};
