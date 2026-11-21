import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const PALETTE = [
  '#059669', '#0284C7', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#4F46E5', '#65A30D'
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface border border-border-subtle px-3 py-2 rounded-md shadow-e2 text-xs">
        <p className="font-semibold text-text-primary">{data.location_name}</p>
        <p className="text-text-secondary font-mono mt-0.5">
          Reports: <span className="font-bold">{data.count}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const LocalityDonut = ({ data = [], total = 0 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border-subtle rounded-lg shadow-e1 p-5 h-80 flex flex-col items-center justify-center text-center">
        <p className="text-xs text-text-muted">No locality distribution recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-lg shadow-e1 p-5 flex flex-col h-80">
      <div className="border-b border-border-subtle pb-3 mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Locality Distribution</h3>
          <p className="text-[11px] text-text-secondary">Ward complaints relative share</p>
        </div>
        <span className="text-[11px] font-mono text-text-muted">{data.length} wards</span>
      </div>

      <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="location_name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
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
          <span className="text-xl font-bold tabular-nums text-text-primary">{total}</span>
          <span className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">Total</span>
        </div>
      </div>

      {/* Mini Bottom Legend */}
      <div className="flex items-center justify-center gap-3 flex-wrap mt-2 pt-2 border-t border-border-subtle text-[11px]">
        {data.slice(0, 4).map((entry, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span 
              className="w-2.5 h-2.5 rounded-sm shrink-0" 
              style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} 
            />
            <span className="text-text-secondary truncate max-w-[80px]">{entry.location_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
