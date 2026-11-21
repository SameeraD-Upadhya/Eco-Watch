import React, { useState } from 'react';
import { 
  StatusBadge, 
  SeverityBadge, 
  CategoryChip 
} from '../common/Badge';
import { StatusSpine } from '../common/StatusSpine';
import { 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Clock, 
  Trash2, 
  MapPin, 
  User, 
  CheckCircle2,
  Calendar
} from 'lucide-react';

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export const ReportCard = ({ 
  report, 
  categoryColors = {}, 
  onActionClick, 
  onDeleteClick 
}) => {
  const [expanded, setExpanded] = useState(false);

  const responseCount = report.responses?.length || 0;
  const categoryColor = categoryColors[report.category_name] || '#10B981';

  return (
    <div className="bg-surface border border-border-subtle rounded-lg shadow-e1 hover:border-border-strong transition-all flex overflow-hidden">
      {/* Signature Detail: The Status Spine */}
      <StatusSpine 
        status={report.status} 
        responseCount={responseCount} 
        className="my-3 ml-3"
      />

      {/* Main Card Content */}
      <div className="flex-1 p-4 sm:p-5 min-w-0">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-text-primary bg-app px-2 py-0.5 rounded border border-border-subtle">
              #{report.report_no}
            </span>
            <CategoryChip 
              name={report.category_name} 
              colorHex={categoryColor} 
            />
            <span className="inline-flex items-center gap-1 text-xs text-text-secondary font-medium">
              <MapPin className="w-3.5 h-3.5 text-text-muted" />
              <span>{report.location_name}</span>
            </span>
            <SeverityBadge severity={report.severity} />
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={report.status} />
            <span 
              className="text-[11px] font-mono text-text-muted cursor-help"
              title={`Exact timestamp: ${new Date(report.reported_at).toLocaleString()}`}
            >
              {formatRelativeTime(report.reported_at)}
            </span>
          </div>
        </div>

        {/* Citizen & Description Body */}
        <div className="mt-2.5">
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {report.description}
          </p>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-text-muted">
            <span className="flex items-center gap-1 font-medium text-text-secondary">
              <User className="w-3 h-3 text-text-muted" />
              <span>Reported by {report.citizen_name}</span>
            </span>
            <span>•</span>
            <span className="font-mono">{responseCount} authority action{responseCount === 1 ? '' : 's'} logged</span>
          </div>
        </div>

        {/* Expandable Section: Chronological Response History */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-border-subtle space-y-3">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Municipal Response & Field History
            </div>

            {responseCount === 0 ? (
              <p className="text-xs text-text-muted italic bg-app/50 p-2.5 rounded border border-border-subtle">
                No authority intervention logged yet. Click "Log Authority Action" to update workflow.
              </p>
            ) : (
              <div className="space-y-2 border-l-2 border-border-subtle pl-3 ml-1.5">
                {report.responses.map((resp, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-text-primary">{resp.updated_by}</span>
                      <span className="font-mono text-text-muted">
                        {new Date(resp.updated_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-text-secondary bg-app/60 p-2 rounded border border-border-subtle/60 leading-relaxed">
                      {resp.action_taken}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-text-secondary hover:text-text-primary font-medium flex items-center gap-1 transition-colors"
          >
            {expanded ? (
              <>
                <span>Hide timeline</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>View {responseCount > 0 ? `timeline (${responseCount})` : 'details'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeleteClick(report)}
              className="p-1.5 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title={`Delete report #${report.report_no}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onActionClick(report)}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Log Authority Action</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
