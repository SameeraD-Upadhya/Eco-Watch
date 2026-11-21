import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ChartFrame } from '../common/ChartFrame';

const PALETTE = [
  '#2F5D46', '#2F6F8F', '#B7791F', '#3F7D5A', '#A8322B', '#4A574F', '#8C5E32', '#5A6B5C'
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface border border-border-subtle px-3 py-2 rounded-md shadow-md text-xs">
        <p className="font-semibold text-ink-primary font-serif">{data.location_name}</p>
        <p className="text-text-secondary font-mono mt-0.5">
          Reports: <span className="font-bold text-ink-primary">{data.count}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const LocalityDonut = ({ data = [], total = 0, onNavigateToCitizen }) => {
  const hasData = data && data.length > 0;

  return (
    <ChartFrame
      title="Locality Distribution"
      subtitle="Relative ward report proportions"
      badge={`${data.length} wards`}
      hasData={hasData}
      emptyMessage="No locality distribution recorded yet."
      emptyActionText="Lodge Observation"
      onEmptyAction={onNavigateToCitizen}
      heightClass="h-[320px]"
    >
      <div className="flex-1 w-full min-h-0 relative flex flex-col justify-between">
        <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="location_name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`slice-${index}`} 
                    fill={PALETTE[index % PALETTE.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Donut Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold tabular-nums text-ink-primary font-serif">{total}</span>
            <span className="text-[9px] uppercase tracking-wider text-text-muted font-semibold font-mono">Total</span>
          </div>
        </div>

        {/* Mini Bottom Legend */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap mt-1 pt-1.5 border-t border-border-subtle text-[11px]">
          {data.slice(0, 4).map((entry, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <span 
                className="w-2 h-2 rounded-sm shrink-0" 
                style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} 
              />
              <span className="text-text-secondary truncate max-w-[80px]">{entry.location_name}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
};
