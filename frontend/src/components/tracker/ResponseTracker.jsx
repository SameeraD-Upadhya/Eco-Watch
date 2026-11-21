import React, { useState } from 'react';
import { FilterBar } from './FilterBar';
import { ReportCard } from './ReportCard';
import { CoordinatorActionModal } from './CoordinatorActionModal';
import { Modal } from '../common/Modal';
import { 
  ClipboardList, 
  PlusCircle, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import { api } from '../../services/api';

export const ResponseTracker = ({
  reports = [],
  categories = [],
  locations = [],
  enums = {},
  filters,
  setFilters,
  sortBy = 'newest',
  setSortBy,
  page = 1,
  pageSize = 20,
  total = 0,
  setPage,
  loading,
  onRefresh,
  addToast,
  onNavigateToCitizen
}) => {
  const [selectedReportForAction, setSelectedReportForAction] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Map category names to color hex
  const categoryColors = {};
  categories.forEach((c) => {
    categoryColors[c.name] = c.color_hex;
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteReport(reportToDelete.report_no);
      addToast(`Report #${reportToDelete.report_no} deleted successfully`);
      setReportToDelete(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to delete report', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickStatusChange = async (report, targetStatus) => {
    try {
      const officer = (typeof window !== 'undefined' && window.sessionStorage?.getItem('ecowatch_officer_name')) || 'Mysuru City Corporation Field Inspector';
      const actionText = targetStatus === 'Resolved'
        ? 'Remediation completed and verified on site.'
        : targetStatus === 'Open'
          ? 'Incident reopened for secondary remediation.'
          : 'Remediation work order initiated in field.';

      await api.updateReportStatus(report.report_no, {
        status: targetStatus,
        updated_by: officer,
        action_taken: actionText
      });
      addToast(`Report #${report.report_no} status updated to ${targetStatus}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const res = await api.exportReports(format);
      let blob;
      let filename;
      if (format === 'json') {
        blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
        filename = `ecowatch-reports-${new Date().toISOString().slice(0, 10)}.json`;
      } else {
        blob = new Blob([res], { type: 'text/csv' });
        filename = `ecowatch-reports-${new Date().toISOString().slice(0, 10)}.csv`;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      addToast(`Reports exported as ${format.toUpperCase()}`);
    } catch (err) {
      addToast(err.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="border-b border-border-subtle pb-3.5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-primary font-serif">Authority Response Tracker</h1>
          <p className="text-xs text-text-secondary mt-1">
            Operational triage, remediation workflow status, and field officer audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1 border border-border-subtle rounded-md bg-sunken/40 p-0.5 text-[11px]">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="px-2 py-1 rounded hover:bg-surface text-text-secondary hover:text-ink-primary transition-colors flex items-center gap-1"
              title="Export filtered reports to CSV"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
            <span className="text-border-strong">|</span>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="px-2 py-1 rounded hover:bg-surface text-text-secondary hover:text-ink-primary transition-colors flex items-center gap-1"
              title="Export filtered reports to JSON"
            >
              <Download className="w-3 h-3" />
              <span>JSON</span>
            </button>
          </div>

          <button
            onClick={onNavigateToCitizen}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Observation</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={categories}
        locations={locations}
        enums={enums}
        totalResults={total}
      />

      {/* Reports Feed */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface border border-border-subtle rounded-md animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-surface border border-dashed border-border-strong rounded-md p-10 text-center max-w-lg mx-auto shadow-sm">
            <ClipboardList className="w-8 h-8 text-text-muted mx-auto mb-2.5" />
            <h3 className="text-sm font-semibold font-serif text-ink-primary">No Matching Environmental Reports</h3>
            <p className="text-xs text-text-secondary mt-1 mb-4">
              No reports match the current filter criteria or the database is empty.
            </p>
            <button
              onClick={onNavigateToCitizen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit First Report</span>
            </button>
          </div>
        ) : (
          reports.map((report) => (
            <ReportCard
              key={report.id || report.report_no}
              report={report}
              categoryColors={categoryColors}
              onActionClick={(r) => setSelectedReportForAction(r)}
              onDeleteClick={(r) => setReportToDelete(r)}
              onQuickStatusChange={handleQuickStatusChange}
            />
          ))
        )}
      </div>

      {/* Server-Side Pagination Controls */}
      {totalPages > 1 && setPage && (
        <div className="flex items-center justify-between pt-3 border-t border-border-subtle flex-wrap gap-2 text-xs">
          <div className="text-text-muted font-mono text-[11px]">
            Page <strong className="text-ink-primary font-bold">{page}</strong> of <strong>{totalPages}</strong> ({total} total records)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="p-1 rounded border border-border-subtle bg-surface text-text-secondary hover:text-ink-primary disabled:opacity-40 transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded border border-border-subtle bg-surface text-text-secondary hover:text-ink-primary disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-2 font-mono font-medium text-ink-primary">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded border border-border-subtle bg-surface text-text-secondary hover:text-ink-primary disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="p-1 rounded border border-border-subtle bg-surface text-text-secondary hover:text-ink-primary disabled:opacity-40 transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Coordinator Action Modal */}
      <CoordinatorActionModal
        isOpen={Boolean(selectedReportForAction)}
        onClose={() => setSelectedReportForAction(null)}
        report={selectedReportForAction}
        enums={enums}
        onSuccess={() => {
          addToast(`Report #${selectedReportForAction?.report_no} updated`);
          if (onRefresh) onRefresh();
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(reportToDelete)}
        onClose={() => setReportToDelete(null)}
        title="Confirm Report Removal"
        subtitle={`Report #${reportToDelete?.report_no} - ${reportToDelete?.category_name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-3.5">
          <p className="text-xs text-text-secondary leading-relaxed">
            Are you sure you want to permanently delete report <strong>#{reportToDelete?.report_no}</strong>? This action will remove the citizen submission and its entire authority response audit history from MongoDB.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              onClick={() => setReportToDelete(null)}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-ink-primary rounded-md border border-border-subtle"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-3.5 py-1.5 text-xs font-semibold bg-status-open hover:bg-status-open/90 text-white rounded-md transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
