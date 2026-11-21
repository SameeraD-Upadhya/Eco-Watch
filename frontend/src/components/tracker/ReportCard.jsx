import React, { useState } from 'react';
import { 
  StatusBadge, 
  SeverityBadge, 
  CategoryChip 
} from '../common/Badge';
import { 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Trash2, 
  MapPin, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Image as ImageIcon, 
  X, 
  RotateCcw, 
  PlayCircle 
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
  onDeleteClick,
  onQuickStatusChange
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  const responseCount = report.responses?.length || 0;
  const categoryColor = categoryColors[report.category_name] || '#2F5D46';

  let spineColor = 'border-l-status-open';
  if (report.status === 'In Progress') spineColor = 'border-l-status-progress';
  if (report.status === 'Resolved') spineColor = 'border-l-status-resolved';

  // Compute SLA status
  const slaHours = report.sla_hours || 48;
  const reportedDate = new Date(report.reported_at);
  const deadline = new Date(reportedDate.getTime() + slaHours * 3600 * 1000);
  const diffHours = (deadline.getTime() - Date.now()) / (3600 * 1000);
  const isResolved = report.status === 'Resolved';
  const isOverdue = !isResolved && diffHours < 0;

  return (
    <div className={`bg-surface border border-border-subtle border-l-[3px] ${spineColor} rounded-md shadow-sm hover:border-border-strong transition-all overflow-hidden`}>
      {/* Main Card Content */}
      <div className="p-4 sm:p-4.5 min-w-0">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-ink-primary bg-sunken px-2 py-0.5 rounded border border-border-subtle">
              #{report.report_no}
            </span>
            <CategoryChip 
              name={report.category_name} 
              colorHex={categoryColor} 
            />
            <span className="inline-flex items-center gap-1 text-xs text-text-secondary font-medium">
              <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>{report.location_name}</span>
              {report.landmark && (
                <span className="text-text-muted italic truncate max-w-[160px]">
                  · {report.landmark}
                </span>
              )}
            </span>
            <SeverityBadge severity={report.severity} />
            {report.corroborations > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-accent-soft text-accent border border-accent/30 font-semibold" title="Resident corroboration endorsements">
                +{report.corroborations} corroborated
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* SLA Badge */}
            {isResolved ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-status-resolved-soft text-status-resolved border border-status-resolved/30">
                Resolved
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-status-open-soft text-status-open border border-status-open/30 font-semibold animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Overdue by {Math.abs(Math.round(diffHours))}h</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-sunken text-text-secondary border border-border-subtle">
                <Clock className="w-2.5 h-2.5 text-text-muted" />
                <span>SLA: {Math.max(1, Math.round(diffHours))}h remaining</span>
              </span>
            )}

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
          <p className="text-xs text-ink-secondary leading-relaxed">
            {report.description}
          </p>

          {/* Photo Evidence Preview Thumbnail */}
          {report.evidence?.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {report.evidence.map((ev, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActivePhotoModal(ev.url)}
                  className="group relative cursor-pointer border border-border-subtle rounded overflow-hidden w-16 h-12 bg-sunken hover:border-primary transition-colors"
                  title="Click to view full photo evidence"
                >
                  <img 
                    src={ev.url} 
                    alt="Evidence" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ImageIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center gap-3.5 text-[11px] text-text-muted flex-wrap">
            <span className="flex items-center gap-1 font-medium text-text-secondary">
              <User className="w-3 h-3 text-text-muted" />
              <span>Reported by {report.citizen_name}</span>
            </span>
            <span className="text-border-strong">•</span>
            <span className="font-mono">{responseCount} authority action{responseCount === 1 ? '' : 's'} logged</span>
            {report.reopened_count > 0 && (
              <>
                <span className="text-border-strong">•</span>
                <span className="text-status-open font-mono font-medium">Reopened ({report.reopened_count}x)</span>
              </>
            )}
            {report.authority_name && (
              <>
                <span className="text-border-strong">•</span>
                <span className="font-mono text-text-muted">Assigned: {report.authority_name}</span>
              </>
            )}
          </div>
        </div>

        {/* Expandable Section: Chronological Response History */}
        {expanded && (
          <div className="mt-3.5 pt-3 border-t border-border-subtle space-y-2.5">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-mono">
              Municipal Response & Field History
            </div>

            {responseCount === 0 ? (
              <p className="text-xs text-text-muted italic bg-sunken/40 p-2.5 rounded border border-border-subtle">
                No authority intervention logged yet. Click "Log Authority Action" to record field remediation.
              </p>
            ) : (
              <div className="space-y-2 border-l-2 border-border-subtle pl-3 ml-1">
                {report.responses.map((resp, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-ink-primary">{resp.updated_by}</span>
                      <span className="font-mono text-text-muted">
                        {new Date(resp.updated_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-text-secondary bg-sunken/50 p-2 rounded border border-border-subtle leading-relaxed">
                      {resp.action_taken}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="mt-3.5 pt-2.5 border-t border-border-subtle flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-text-secondary hover:text-ink-primary font-medium flex items-center gap-1 transition-colors"
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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Transition Shortcut Buttons */}
            {report.status === 'Open' && onQuickStatusChange && (
              <button
                onClick={() => onQuickStatusChange(report, 'In Progress')}
                className="px-2.5 py-1 rounded text-xs font-medium text-status-progress bg-status-progress-soft hover:bg-status-progress/20 transition-colors flex items-center gap-1"
                title="Quick dispatch: set to In Progress"
              >
                <PlayCircle className="w-3 h-3" />
                <span>Start Remediation</span>
              </button>
            )}
            {report.status === 'In Progress' && onQuickStatusChange && (
              <button
                onClick={() => onQuickStatusChange(report, 'Resolved')}
                className="px-2.5 py-1 rounded text-xs font-medium text-status-resolved bg-status-resolved-soft hover:bg-status-resolved/20 transition-colors flex items-center gap-1"
                title="Quick close: set to Resolved"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Mark Resolved</span>
              </button>
            )}
            {report.status === 'Resolved' && onQuickStatusChange && (
              <button
                onClick={() => onQuickStatusChange(report, 'Open')}
                className="px-2.5 py-1 rounded text-xs font-medium text-status-open bg-status-open-soft hover:bg-status-open/20 transition-colors flex items-center gap-1"
                title="Reopen incident"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reopen</span>
              </button>
            )}

            <button
              onClick={() => onDeleteClick(report)}
              className="p-1.5 rounded-md text-text-muted hover:text-status-open hover:bg-status-open-soft transition-colors"
              title={`Delete report #${report.report_no}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onActionClick(report)}
              className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Log Remediation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {activePhotoModal && (
        <div 
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[90vh] overflow-hidden rounded-md bg-surface p-2 shadow-2xl">
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/60 text-white hover:bg-status-open transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img 
              src={activePhotoModal} 
              alt="Report photo evidence" 
              className="w-full h-auto max-h-[80vh] object-contain rounded" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
