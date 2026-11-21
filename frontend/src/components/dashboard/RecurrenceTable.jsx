import React from 'react';
import { AlertTriangle, Clock, MapPin, CheckCircle2, RotateCcw } from 'lucide-react';

function formatDate(isoStr) {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoStr;
  }
}

export const RecurrenceTable = ({ recurrences = [] }) => {
  if (!recurrences || recurrences.length === 0) {
    return (
      <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-6 text-center">
        <p className="text-xs text-text-muted">No recurring environmental patterns detected yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-md shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold font-serif text-ink-primary">
              Recurring Environmental Hotspots
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-open-soft text-status-open border border-status-open/30">
              Top {recurrences.length} Clusters
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Ward and hazard pairs exhibiting repeat occurrences, persistence across multiple reporting cycles, or re-emergence.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-sunken/40 text-text-secondary font-mono text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Ward / Locality</th>
              <th className="py-2.5 px-3">Hazard Category</th>
              <th className="py-2.5 px-3 text-center">Volume</th>
              <th className="py-2.5 px-3">Date Span</th>
              <th className="py-2.5 px-3 text-center">Median Interval</th>
              <th className="py-2.5 px-3">Status Ratio</th>
              <th className="py-2.5 px-3 text-right">Classification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle font-sans">
            {recurrences.map((item, idx) => {
              const tag = item.recurrence_tag || (item.count >= 5 ? 'Chronic' : item.count >= 3 ? 'Recurring' : 'Isolated');
              const isChronic = tag === 'Chronic';
              const isRecurring = tag === 'Recurring';

              const total = (item.open_count || 0) + (item.resolved_count || 0);
              const resolvedPct = total > 0 ? Math.round(((item.resolved_count || 0) / total) * 100) : 0;

              return (
                <tr key={`${item.location_name}-${item.category_name}`} className="hover:bg-sunken/30 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-text-muted">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 font-medium text-ink-primary">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{item.location_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-serif text-ink-primary">
                    {item.category_name}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-sunken border border-border-subtle text-ink-primary">
                      {item.count}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-text-secondary font-mono">
                    {formatDate(item.first_reported)} — {formatDate(item.last_reported)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-[11px] text-text-secondary">
                    {item.median_gap_days !== null && item.median_gap_days !== undefined
                      ? `~${item.median_gap_days} days`
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="w-28 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-text-secondary">
                        <span className="text-status-open">{item.open_count || 0} open</span>
                        <span className="text-status-resolved">{item.resolved_count || 0} res</span>
                      </div>
                      <div className="h-1.5 w-full bg-status-open/20 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-status-resolved h-full transition-all duration-300"
                          style={{ width: `${resolvedPct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      isChronic
                        ? 'bg-status-open-soft text-status-open border-status-open/30'
                        : isRecurring
                          ? 'bg-status-medium-soft text-status-medium border-status-medium/30'
                          : 'bg-sunken text-text-secondary border-border-subtle'
                    }`}>
                      {isChronic && <AlertTriangle className="w-3 h-3 shrink-0" />}
                      {item.reopened && <RotateCcw className="w-3 h-3 shrink-0" />}
                      <span>{tag}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
