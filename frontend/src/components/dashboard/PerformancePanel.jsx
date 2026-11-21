import React from 'react';
import { 
  Clock, 
  ShieldCheck, 
  AlertOctagon, 
  RotateCcw, 
  Building2, 
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';

export const PerformancePanel = ({ 
  zonePerformances = [], 
  categoryPerformances = [], 
  authorityCompliances = [],
  oldestUnresolved = [],
  avgTurnaround,
  medianTurnaround,
  reopenRate,
  resolutionRate
}) => {
  return (
    <div className="space-y-5">
      {/* 1. Civic Authorities SLA Compliance Strip */}
      <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4">
        <div className="border-b border-border-subtle pb-2.5 mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
              Statutory Authority SLA Compliance
            </h3>
            <p className="text-[11px] text-text-muted">
              Remediation completed within statutory turnaround limits
            </p>
          </div>
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>

        {authorityCompliances.length === 0 ? (
          <p className="text-xs text-text-muted py-2 text-center">No resolved incidents with authority records yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {authorityCompliances.map((auth) => {
              const rate = auth.compliance_rate;
              const isHigh = rate >= 90;
              const isMed = rate >= 75 && rate < 90;

              return (
                <div key={auth.authority_name} className="p-3 bg-sunken/40 border border-border-subtle rounded-md flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-ink-primary font-serif">
                      {auth.authority_name}
                    </span>
                    <span className={`text-xs font-mono font-bold ${
                      isHigh ? 'text-status-resolved' : isMed ? 'text-status-medium' : 'text-status-open'
                    }`}>
                      {rate}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isHigh ? 'bg-status-resolved' : isMed ? 'bg-status-medium' : 'bg-status-open'
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>{auth.compliant_count} / {auth.total_resolved} resolved in SLA</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Turnaround Times & Oldest Unresolved Backlog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Turnaround by Category / Zone */}
        <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 flex flex-col">
          <div className="border-b border-border-subtle pb-2.5 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
                Remediation Turnaround Benchmarks
              </h3>
              <p className="text-[11px] text-text-muted">
                Mean and median elapsed time from intake to resolution
              </p>
            </div>
            <Clock className="w-4 h-4 text-text-secondary" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-sunken/50 border border-border-subtle rounded-md text-center">
              <span className="text-[11px] text-text-muted uppercase font-mono">Mean Turnaround</span>
              <p className="text-lg font-bold font-mono text-ink-primary mt-0.5">
                {avgTurnaround ? `${avgTurnaround}h` : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-sunken/50 border border-border-subtle rounded-md text-center">
              <span className="text-[11px] text-text-muted uppercase font-mono">Median Turnaround</span>
              <p className="text-lg font-bold font-mono text-primary mt-0.5">
                {medianTurnaround ? `${medianTurnaround}h` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Table of category turnaround */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted font-mono text-[10px] uppercase">
                  <th className="py-1.5 px-2">Category</th>
                  <th className="py-1.5 px-2 text-center">SLA Limit</th>
                  <th className="py-1.5 px-2 text-center">Mean Time</th>
                  <th className="py-1.5 px-2 text-right">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {categoryPerformances.slice(0, 5).map((cp) => (
                  <tr key={cp.category_name} className="hover:bg-sunken/20">
                    <td className="py-2 px-2 font-serif text-ink-primary truncate max-w-[150px]">
                      {cp.category_name}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-text-secondary">
                      {cp.sla_hours}h
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-medium text-ink-primary">
                      {cp.avg_turnaround_hours ? `${cp.avg_turnaround_hours}h` : 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-xs">
                      <span className={cp.sla_compliance_rate >= 80 ? 'text-status-resolved' : 'text-status-open'}>
                        {cp.sla_compliance_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Oldest Unresolved Incidents */}
        <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 flex flex-col">
          <div className="border-b border-border-subtle pb-2.5 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
                Longest Pending Incident Backlog
              </h3>
              <p className="text-[11px] text-text-muted">
                Unresolved observations requiring supervisory escalation
              </p>
            </div>
            <AlertOctagon className="w-4 h-4 text-status-open" />
          </div>

          {oldestUnresolved.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-6 text-xs text-text-muted">
              Zero pending backlog. All recorded complaints resolved.
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle text-text-muted font-mono text-[10px] uppercase">
                    <th className="py-1.5 px-2">Ref</th>
                    <th className="py-1.5 px-2">Locality</th>
                    <th className="py-1.5 px-2">Category</th>
                    <th className="py-1.5 px-2 text-center">Severity</th>
                    <th className="py-1.5 px-2 text-right">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {oldestUnresolved.map((item) => (
                    <tr key={item.report_no} className="hover:bg-sunken/20">
                      <td className="py-2.5 px-2 font-mono font-bold text-ink-primary">
                        #{item.report_no}
                      </td>
                      <td className="py-2.5 px-2 text-ink-primary truncate max-w-[110px]">
                        {item.location_name}
                      </td>
                      <td className="py-2.5 px-2 font-serif text-text-secondary truncate max-w-[130px]">
                        {item.category_name}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          item.severity === 'High'
                            ? 'bg-status-open-soft text-status-open border-status-open/30'
                            : item.severity === 'Medium'
                              ? 'bg-status-medium-soft text-status-medium border-status-medium/30'
                              : 'bg-sunken text-text-secondary border-border-subtle'
                        }`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-status-open">
                        {item.age_days}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
