import React, { useState } from 'react';
import { Send, RotateCcw, AlertCircle, CheckCircle, Tag, MapPin, User, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { EmptyMasterDataPrompt } from './EmptyMasterDataPrompt';

export const CitizenForm = ({ 
  categories = [], 
  locations = [], 
  enums = {}, 
  onSuccess, 
  onNavigateToMaster 
}) => {
  const [formData, setFormData] = useState({
    citizen_name: '',
    category_id: '',
    location_id: '',
    severity: 'Medium',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // If DB has no categories or locations, prompt user cleanly
  if (categories.length === 0 || locations.length === 0) {
    return <EmptyMasterDataPrompt onNavigateToMaster={onNavigateToMaster} />;
  }

  const validate = () => {
    const newErrors = {};
    if (!formData.citizen_name.trim() || formData.citizen_name.trim().length < 2) {
      newErrors.citizen_name = 'Please provide citizen or reporter name (min 2 chars)';
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Please select an environmental category';
    }
    if (!formData.location_id) {
      newErrors.location_id = 'Please select a municipal ward / locality';
    }
    if (!formData.description.trim() || formData.description.trim().length < 5) {
      newErrors.description = 'Please detail the environmental observation (min 5 characters)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const res = await api.createReport(formData);
      setSubmitSuccess(true);
      if (onSuccess) {
        onSuccess(res);
      }
      // Reset form
      setFormData({
        citizen_name: '',
        category_id: '',
        location_id: '',
        severity: 'Medium',
        description: ''
      });
      setErrors({});
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to submit report. Please check backend connection.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      citizen_name: '',
      category_id: '',
      location_id: '',
      severity: 'Medium',
      description: ''
    });
    setErrors({});
  };

  const selectedCategory = categories.find((c) => c.id === formData.category_id);
  const severities = enums.severities?.length ? enums.severities : ['Low', 'Medium', 'High'];

  return (
    <div className="max-w-2xl mx-auto bg-surface border border-border-subtle rounded-lg shadow-e1 p-6 sm:p-8">
      <div className="mb-6 pb-4 border-b border-border-subtle flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Lodge Environmental Observation</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Directly routed to the Mysuru municipal remediation queue.
          </p>
        </div>
        <span className="text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-sm border border-emerald-500/20">
          STATUS: OPEN ON SUBMISSION
        </span>
      </div>

      {submitSuccess && (
        <div className="mb-6 p-4 rounded-md bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Report successfully registered and queued for municipal remediation.</span>
        </div>
      )}

      {errors.form && (
        <div className="mb-6 p-4 rounded-md bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Citizen / Reporter Name */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-text-muted" />
            <span>Citizen / Reporting Entity</span>
          </label>
          <input
            type="text"
            value={formData.citizen_name}
            onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
            placeholder="e.g. Ramesh Kumar or Resident Welfare Association"
            className={`w-full px-3 py-2 text-xs rounded-sm bg-app border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-all ${
              errors.citizen_name 
                ? 'border-rose-500 focus:ring-rose-500' 
                : 'border-border-subtle focus:ring-emerald-500'
            }`}
          />
          {errors.citizen_name && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.citizen_name}</p>
          )}
        </div>

        {/* 2-Column: Category & Location Dropdowns (Strictly from MongoDB) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-text-muted" />
                <span>Environmental Category</span>
              </span>
              {selectedCategory && (
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block shadow-xs" 
                  style={{ backgroundColor: selectedCategory.color_hex }}
                />
              )}
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-sm bg-app border text-text-primary focus:outline-none focus:ring-1 transition-all ${
                errors.category_id 
                  ? 'border-rose-500 focus:ring-rose-500' 
                  : 'border-border-subtle focus:ring-emerald-500'
              }`}
            >
              <option value="">Select category ({categories.length} registered)...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.category_id}</p>
            )}
          </div>

          {/* Location Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-text-muted" />
              <span>Municipal Ward / Locality</span>
            </label>
            <select
              value={formData.location_id}
              onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-sm bg-app border text-text-primary focus:outline-none focus:ring-1 transition-all ${
                errors.location_id 
                  ? 'border-rose-500 focus:ring-rose-500' 
                  : 'border-border-subtle focus:ring-emerald-500'
              }`}
            >
              <option value="">Select ward ({locations.length} registered)...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.ward_name} {l.zone ? `(${l.zone})` : ''}
                </option>
              ))}
            </select>
            {errors.location_id && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.location_id}</p>
            )}
          </div>
        </div>

        {/* Severity Segmented Control */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Impact Severity Level
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-app rounded-md border border-border-subtle">
            {severities.map((sev) => {
              const isSelected = formData.severity === sev;
              let activeColor = 'bg-sky-600 text-white';
              if (sev === 'Medium') activeColor = 'bg-amber-600 text-white';
              if (sev === 'High') activeColor = 'bg-red-600 text-white';

              return (
                <button
                  type="button"
                  key={sev}
                  onClick={() => setFormData({ ...formData, severity: sev })}
                  className={`py-2 text-xs font-medium rounded-sm transition-all text-center ${
                    isSelected
                      ? `${activeColor} shadow-xs font-semibold`
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {sev}
                </button>
              );
            })}
          </div>
        </div>

        {/* Observation Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-text-muted" />
              <span>Observation Description & Landmarks</span>
            </label>
            <span className={`text-[11px] tabular-nums font-mono ${
              formData.description.length > 1900 ? 'text-rose-600' : 'text-text-muted'
            }`}>
              {formData.description.length}/2000
            </span>
          </div>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the environmental issue, specific street cross, landmark, duration, or immediate hazard..."
            className={`w-full px-3 py-2 text-xs rounded-sm bg-app border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-all resize-none ${
              errors.description 
                ? 'border-rose-500 focus:ring-rose-500' 
                : 'border-border-subtle focus:ring-emerald-500'
            }`}
          />
          {errors.description && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.description}</p>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-app border border-border-subtle transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Registering Report...' : 'Submit Observation Report'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
