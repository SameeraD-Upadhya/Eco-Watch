import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';

const SESSION_OFFICER_KEY = 'ecowatch_officer_name';

const ALLOWED_TARGETS = {
  'Open': ['In Progress', 'Resolved', 'Open'],
  'In Progress': ['Resolved', 'Open', 'In Progress'],
  'Resolved': ['Open', 'Resolved']
};

export const CoordinatorActionModal = ({ 
  isOpen, 
  onClose, 
  report, 
  enums = {}, 
  onSuccess 
}) => {
  const [statusVal, setStatusVal] = useState('In Progress');
  const [updatedBy, setUpdatedBy] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(SESSION_OFFICER_KEY) || 'Mysuru City Corporation Field Inspector';
    }
    return 'Mysuru City Corporation Field Inspector';
  });
  const [actionTaken, setActionTaken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set default target status based on current report state
  useEffect(() => {
    if (report) {
      if (report.status === 'Open') setStatusVal('In Progress');
      else if (report.status === 'In Progress') setStatusVal('Resolved');
      else if (report.status === 'Resolved') setStatusVal('Open');
      else setStatusVal('In Progress');
      setError(null);
      setActionTaken('');
    }
  }, [report]);

  if (!report) return null;

  const validTargets = ALLOWED_TARGETS[report.status] || ['Open', 'In Progress', 'Resolved'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actionTaken.trim()) {
      setError('Please document the remediation action taken or scheduled.');
      return;
    }
    if (!updatedBy.trim()) {
      setError('Please enter the officer name or division code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Save officer name to session storage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(SESSION_OFFICER_KEY, updatedBy.trim());
      }

      const updated = await api.updateReportStatus(report.report_no, {
        status: statusVal,
        updated_by: updatedBy.trim(),
        action_taken: actionTaken.trim()
      });
      if (onSuccess) onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update report status');
    } finally {
      setLoading(false);
    }
  };

  const isReopening = report.status === 'Resolved' && statusVal === 'Open';

  const buttonActionText = isReopening
    ? 'Reopen report and record note'
    : statusVal === 'Resolved' 
      ? 'Log response and mark Resolved' 
      : statusVal === 'In Progress' 
        ? 'Log response and mark In Progress' 
        : 'Log response and keep Open';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReopening ? `Reopen Report #${report.report_no}` : `Log Remediation: Report #${report.report_no}`}
      subtitle={`${report.category_name} in ${report.location_name}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-2.5 rounded text-xs bg-status-open-soft border border-status-open/30 text-status-open flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current status display & valid target status */}
        <div>
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="font-semibold text-ink-primary font-mono">Workflow Transition:</span>
            <span className="text-text-muted">Current status: <strong>{report.status}</strong></span>
          </div>
          <select
            value={statusVal}
            onChange={(e) => setStatusVal(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-sunken/40 rounded-sm border border-border-subtle text-ink-primary focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            {validTargets.map((s) => (
              <option key={s} value={s}>
                {s === 'Open' && report.status === 'Resolved' ? 'Reopen incident -> Open' : `Set Status to: ${s}`}
              </option>
            ))}
          </select>
        </div>

        {/* Responsible Officer */}
        <div>
          <label className="block text-xs font-semibold text-ink-primary mb-1 font-mono">
            Responding Officer / Unit (Remembered in session)
          </label>
          <input
            type="text"
            value={updatedBy}
            onChange={(e) => setUpdatedBy(e.target.value)}
            placeholder="Officer Name / Ward Squad (e.g. Inspector R. Rao - Zone 3)"
            className="w-full px-2.5 py-1.5 text-xs bg-sunken/40 rounded-sm border border-border-subtle text-ink-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Remediation Action Note */}
        <div>
          <label className="block text-xs font-semibold text-ink-primary mb-1 font-mono">
            Remediation Action Note & Dispatch Details
          </label>
          <textarea
            rows={3}
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="Document physical intervention, contractor notified, or debris clearance..."
            className="w-full px-2.5 py-1.5 text-xs bg-sunken/40 rounded-sm border border-border-subtle text-ink-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 border-t border-border-subtle flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-ink-primary rounded-md border border-border-subtle hover:bg-sunken transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isReopening ? <RotateCcw className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{loading ? 'Recording...' : buttonActionText}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
