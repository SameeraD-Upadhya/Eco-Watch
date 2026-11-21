import React from 'react';
import { Award, AlertTriangle, MapPin, Layers } from 'lucide-react';

export const WardRankings = ({ topWards = [], bottomZones = [], totalReports = 0 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Top Wards by Volume */}
      <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 flex flex-col">
        <div className="border-b border-border-subtle pb-2.5 mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
              Top Incident Load by Ward
            </h3>
            <p className="text-[11px] text-text-muted">
              Municipal wards generating highest cumulative environmental reports
            </p>
          </div>
          <Award className="w-4 h-4 text-primary" />
        </div>

        <div className="space-y-2.5 flex-1 justify-center flex flex-col">
          {topWards.map((w, index) => {
            const pct = totalReports > 0 ? Math.round((w.count / totalReports) * 100) : 0;
            return (
              <div key={w.location_name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-ink-primary">
                    <span className="font-mono text-text-muted w-4">#{index + 1}</span>
                    <span className="truncate max-w-[220px]">{w.location_name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="font-bold text-ink-primary">{w.count} reports</span>
                    <span className="text-text-muted">({pct}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-sunken rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pct * 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Zones by Resolution Rate */}
      <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 flex flex-col">
        <div className="border-b border-border-subtle pb-2.5 mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
              Administrative Zones Resolution Lag
            </h3>
            <p className="text-[11px] text-text-muted">
              Municipal zones exhibiting lowest remediation closure ratios
            </p>
          </div>
          <Layers className="w-4 h-4 text-status-medium" />
        </div>

        <div className="space-y-2.5 flex-1 justify-center flex flex-col">
          {bottomZones.map((z) => {
            const isLagging = z.resolution_rate < 30 || z.is_lagging;

            return (
              <div key={z.zone} className="p-2.5 bg-sunken/40 border border-border-subtle rounded-md flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-semibold text-xs text-ink-primary">{z.zone}</span>
                    {isLagging && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-status-open-soft text-status-open border border-status-open/30">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Lagging
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    {z.resolved_reports} of {z.total_reports} resolved • Turnaround: {z.avg_turnaround_hours ? `${z.avg_turnaround_hours}h` : 'N/A'}
                  </span>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-bold font-mono ${
                    z.resolution_rate >= 70 ? 'text-status-resolved' : z.resolution_rate >= 40 ? 'text-status-medium' : 'text-status-open'
                  }`}>
                    {z.resolution_rate}%
                  </span>
                  <p className="text-[10px] text-text-muted uppercase font-mono">Closure</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
