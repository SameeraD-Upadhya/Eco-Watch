import React, { useState } from 'react';
import { FilterBar } from './FilterBar';
import { ReportCard } from './ReportCard';
import { CoordinatorActionModal } from './CoordinatorActionModal';
import { Modal } from '../common/Modal';
import { ClipboardList, PlusCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const ResponseTracker = ({
  reports = [],
  categories = [],
  locations = [],
  enums = {},
  filters,
  setFilters,
  loading,
  onRefresh,
  addToast,
  onNavigateToCitizen
}) => {
  const [selectedReportForAction, setSelectedReportForAction] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map category names to color hex
  const categoryColors = {};
  categories.forEach((c) => {
    categoryColors[c.name] = c.color_hex;
  });

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

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="border-b border-border-subtle pb-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Authority Response Tracker</h1>
          <p className="text-xs text-text-secondary mt-1">
            Operational triage, remediation workflow status, and field officer audit trail.
          </p>
        </div>

        <button
          onClick={onNavigateToCitizen}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Observation</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        locations={locations}
        enums={enums}
        totalResults={reports.length}
      />

      {/* Reports Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface border border-border-subtle rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-surface border border-dashed border-border-strong rounded-lg p-12 text-center max-w-lg mx-auto">
            <ClipboardList className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">No Matching Environmental Reports</h3>
            <p className="text-xs text-text-secondary mt-1 mb-5">
              No reports match the current filter criteria or the database is empty.
            </p>
            <button
              onClick={onNavigateToCitizen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold shadow-xs"
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
            />
          ))
        )}
      </div>

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
        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Are you sure you want to permanently delete report <strong>#{reportToDelete?.report_no}</strong>? This action will remove the citizen submission and its entire authority response audit history from MongoDB.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              onClick={() => setReportToDelete(null)}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-md border border-border-subtle"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
