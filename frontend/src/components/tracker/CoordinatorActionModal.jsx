import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CheckCircle2, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const CoordinatorActionModal = ({ 
  isOpen, 
  onClose, 
  report, 
  enums = {}, 
  onSuccess 
}) => {
  const [status, setStatus] = useState('In Progress');
  const [updatedBy, setUpdatedBy] = useState('Mysuru City Corporation Field Officer');
  const [actionTaken, setActionTaken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!report) return null;

  const statuses = enums.statuses?.length ? enums.statuses : ['Open', 'In Progress', 'Resolved'];

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
      const updated = await api.updateReportStatus(report.report_no, {
        status,
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

  const buttonActionText = status === 'Resolved' 
    ? 'Log response and mark Resolved' 
    : status === 'In Progress' 
      ? 'Log response and mark In Progress' 
      : 'Log response and keep Open';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Municipal Remediation: Report #${report.report_no}`}
      subtitle={`${report.category_name} in ${report.location_name}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded text-xs bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current status vs Target status */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Update Workflow Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-app rounded-md border border-border-subtle text-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>Set Status to: {s}</option>
            ))}
          </select>
        </div>

        {/* Responsible Officer */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Responding Officer / Unit
          </label>
          <input
            type="text"
            value={updatedBy}
            onChange={(e) => setUpdatedBy(e.target.value)}
            placeholder="Officer Name / Ward Squad (e.g. Inspector R. Rao - Zone 3)"
            className="w-full px-3 py-2 text-xs bg-app rounded-md border border-border-subtle text-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Remediation Action Note */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Remediation Action Note & Dispatch Details
          </label>
          <textarea
            rows={3}
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="Document physical intervention, contractor notified, or debris clearance..."
            className="w-full px-3 py-2 text-xs bg-app rounded-md border border-border-subtle text-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 border-t border-border-subtle flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded-md border border-border-subtle hover:bg-app transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{loading ? 'Recording...' : buttonActionText}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
