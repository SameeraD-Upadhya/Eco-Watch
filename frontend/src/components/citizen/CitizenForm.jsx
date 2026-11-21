import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  MapPin, 
  User, 
  FileText, 
  Clock, 
  Building2, 
  Camera, 
  X, 
  Phone, 
  Mail, 
  Eye, 
  Users 
} from 'lucide-react';
import { api } from '../../services/api';
import { EmptyMasterDataPrompt } from './EmptyMasterDataPrompt';
import { WardCombobox } from './WardCombobox';
import { CategoryIcon } from '../common/CategoryIcon';

// Client-side image resize via HTML5 canvas (max 1600px, JPEG 0.82)
async function resizeImage(file, maxDimension = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas compression failed'));
              return;
            }
            const resizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve({ file: resizedFile, previewUrl: URL.createObjectURL(blob) });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SEVERITY_DESCRIPTIONS = {
  Low: 'Localized nuisance, low environmental urgency',
  Medium: 'Moderate civic or public health impact',
  High: 'Severe environmental or contamination emergency'
};

export const CitizenForm = ({ 
  categories = [], 
  locations = [], 
  enums = {}, 
  onSuccess, 
  onNavigateToMaster 
}) => {
  const [formData, setFormData] = useState({
    citizen_name: '',
    contact: '',
    category_id: '',
    location_id: '',
    landmark: '',
    severity: 'Medium',
    description: ''
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [lodgedReport, setLodgedReport] = useState(null);

  // Duplicate Nudge State
  const [similarReports, setSimilarReports] = useState([]);
  const [corroboratingId, setCorroboratingId] = useState(null);
  const fileInputRef = useRef(null);

  const selectedCategory = categories.find((c) => c.id === formData.category_id);
  const selectedLocation = locations.find((l) => l.id === formData.location_id);
  const severities = enums.severities?.length ? enums.severities : ['Low', 'Medium', 'High'];

  // Debounced Duplicate Nudge check when category & ward are both selected
  useEffect(() => {
    let active = true;
    if (selectedCategory && selectedLocation) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.getSimilarReports(selectedLocation.ward_name, selectedCategory.name);
          if (active && res?.similar_reports?.length > 0) {
            setSimilarReports(res.similar_reports);
          } else if (active) {
            setSimilarReports([]);
          }
        } catch {
          if (active) setSimilarReports([]);
        }
      }, 350);

      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else {
      setSimilarReports([]);
    }
  }, [formData.category_id, formData.location_id, selectedCategory, selectedLocation]);

  // If DB has no categories or locations, prompt user cleanly
  if (categories.length === 0 || locations.length === 0) {
    return <EmptyMasterDataPrompt onNavigateToMaster={onNavigateToMaster} />;
  }

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Only image files (.jpg, .png, .webp) are supported.' }));
      return;
    }

    try {
      setUploadingPhoto(true);
      const { file: resized, previewUrl } = await resizeImage(file, 1600, 0.82);
      setPhotoFile(resized);
      setPhotoPreview(previewUrl);
      setErrors((prev) => ({ ...prev, photo: null }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, photo: 'Failed to process image preview.' }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.citizen_name.trim() || formData.citizen_name.trim().length < 2) {
      newErrors.citizen_name = 'Please provide citizen or reporting entity name (min 2 chars)';
    }
    if (formData.contact.trim()) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.trim());
      const isPhone = /^[0-9+\s-]{8,15}$/.test(formData.contact.trim());
      if (!isEmail && !isPhone) {
        newErrors.contact = 'Please provide a valid phone number or email address';
      }
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Please select an environmental category';
    }
    if (!formData.location_id) {
      newErrors.location_id = 'Please select a municipal ward';
    }
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      newErrors.description = 'Please detail the environmental observation (min 20 characters)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setErrors({});

      let evidenceList = [];
      // Upload photo if present
      if (photoFile) {
        try {
          const uploadRes = await api.uploadEvidence(photoFile);
          if (uploadRes?.url) {
            evidenceList.push({
              url: uploadRes.url,
              type: 'photo',
              uploaded_at: new Date().toISOString()
            });
          }
        } catch (uploadErr) {
          console.warn('Evidence photo upload failed:', uploadErr);
        }
      }

      const payload = {
        citizen_name: formData.citizen_name.trim(),
        category_id: formData.category_id,
        location_id: formData.location_id,
        landmark: formData.landmark.trim(),
        severity: formData.severity,
        description: formData.description.trim(),
        evidence: evidenceList
      };

      let res;
      if (!navigator.onLine) {
        const offlineQueueKey = 'ecowatch_offline_reports';
        const existing = JSON.parse(localStorage.getItem(offlineQueueKey) || '[]');
        const offlineId = `OFFLINE-${Date.now().toString().slice(-6)}`;
        existing.push({ ...payload, offline_id: offlineId, queued_at: new Date().toISOString() });
        localStorage.setItem(offlineQueueKey, JSON.stringify(existing));
        setLodgedReport({ report_no: offlineId, is_offline: true });
        removePhoto();
        return;
      }

      try {
        res = await api.createReport(payload);
        setLodgedReport(res);
        removePhoto();
      } catch (submitErr) {
        if (!navigator.onLine || submitErr.message?.includes('fetch') || submitErr.message?.includes('Network')) {
          const offlineQueueKey = 'ecowatch_offline_reports';
          const existing = JSON.parse(localStorage.getItem(offlineQueueKey) || '[]');
          const offlineId = `OFFLINE-${Date.now().toString().slice(-6)}`;
          existing.push({ ...payload, offline_id: offlineId, queued_at: new Date().toISOString() });
          localStorage.setItem(offlineQueueKey, JSON.stringify(existing));
          setLodgedReport({ report_no: offlineId, is_offline: true });
          removePhoto();
        } else {
          throw submitErr;
        }
      }
    } catch (err) {
      setErrors({ form: err.message || 'Failed to submit report. Please check backend connectivity.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Corroborate an existing similar report
  const handleCorroborate = async (targetReportNo) => {
    try {
      setCorroboratingId(targetReportNo);
      const note = formData.description.trim() || `Corroborated by ${formData.citizen_name || 'Resident'}`;
      await api.corroborateReport(targetReportNo, {
        citizen_name: formData.citizen_name.trim() || 'Resident',
        note: note
      });
      setLodgedReport({ report_no: targetReportNo, is_corroboration: true });
    } catch (err) {
      setErrors({ form: err.message || 'Failed to corroborate report' });
    } finally {
      setCorroboratingId(null);
    }
  };

  const handleReset = () => {
    setFormData({
      citizen_name: '',
      contact: '',
      category_id: '',
      location_id: '',
      landmark: '',
      severity: 'Medium',
      description: ''
    });
    removePhoto();
    setErrors({});
    setSimilarReports([]);
  };

  // Clear success state
  if (lodgedReport) {
    return (
      <div className="max-w-xl mx-auto bg-surface border border-border-subtle rounded-md shadow-md p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-status-resolved-soft text-status-resolved flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 stroke-[2]" />
        </div>

        <div>
          <h2 className="text-lg font-bold font-serif text-ink-primary">
            {lodgedReport.is_corroboration
              ? 'Observation Corroborated'
              : lodgedReport.is_offline
                ? 'Report Queued Locally (Offline)'
                : 'Report Lodged Successfully'}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {lodgedReport.is_corroboration
              ? `Your observation was recorded against active Report #${lodgedReport.report_no}. Corroboration score incremented.`
              : lodgedReport.is_offline
                ? 'Device is currently offline. Your report is stored safely and will be automatically submitted when internet connectivity resumes.'
                : `Report #${lodgedReport.report_no} has been registered and assigned to the municipal remediation queue.`}
          </p>
        </div>

        <div className="p-3 bg-sunken/60 rounded-md border border-border-subtle font-mono text-xs text-ink-primary">
          Reference ID: <strong>{lodgedReport.is_offline ? lodgedReport.report_no : `#${lodgedReport.report_no}`}</strong>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setLodgedReport(null);
              handleReset();
            }}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-ink-primary border border-border-subtle hover:bg-sunken transition-colors"
          >
            Submit Another Report
          </button>
          <button
            onClick={() => {
              if (onSuccess) onSuccess(lodgedReport);
            }}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View in Response Tracker</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-surface border border-border-subtle rounded-md shadow-sm p-5 sm:p-6">
      <div className="mb-5 pb-3 border-b border-border-subtle flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold font-serif text-ink-primary">Lodge Environmental Observation</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Directly routed to the Mysuru municipal remediation queue.
          </p>
        </div>
        <span className="text-[10px] font-mono font-medium text-primary bg-primary-soft px-2 py-0.5 rounded-sm border border-primary/20">
          STATUS: OPEN ON SUBMISSION
        </span>
      </div>

      {errors.form && (
        <div className="mb-4 p-3 rounded-md bg-status-open-soft border border-status-open/30 text-status-open text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Duplicate Nudge Callout */}
      {similarReports.length > 0 && (
        <div className="mb-5 p-3.5 rounded-md bg-accent-soft border border-accent/30 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-accent font-mono">
            <Users className="w-4 h-4 shrink-0" />
            <span>Similar Issue Already Reported in this Ward</span>
          </div>
          <p className="text-text-secondary text-[11px] leading-relaxed">
            Report <strong>#{similarReports[0].report_no}</strong> for <em>{similarReports[0].category_name}</em> was lodged in {similarReports[0].location_name}. Avoid duplicates by adding your observation to the existing municipal file.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={corroboratingId === similarReports[0].report_no}
              onClick={() => handleCorroborate(similarReports[0].report_no)}
              className="px-3 py-1 bg-accent hover:bg-accent/90 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{corroboratingId === similarReports[0].report_no ? 'Corroborating...' : `Add your observation to Report #${similarReports[0].report_no}`}</span>
            </button>
            <span className="text-[10px] text-text-muted">or continue below to submit a separate incident</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Citizen Name & Contact (2-Column) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1 flex items-center gap-1.5 font-mono">
              <User className="w-3.5 h-3.5 text-text-muted" />
              <span>Citizen / Reporting Entity</span>
            </label>
            <input
              type="text"
              value={formData.citizen_name}
              onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
              placeholder="e.g. Ramesh Kumar or Resident Association"
              className={`w-full px-3 py-1.5 text-xs rounded-sm bg-sunken/40 border text-ink-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-all ${
                errors.citizen_name ? 'border-status-open focus:ring-status-open' : 'border-border-subtle focus:ring-primary'
              }`}
            />
            {errors.citizen_name && (
              <p className="text-[11px] text-status-open mt-1">{errors.citizen_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1 flex items-center gap-1.5 font-mono">
              <Phone className="w-3.5 h-3.5 text-text-muted" />
              <span>Contact Phone / Email (Optional)</span>
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="For authority status SMS/call updates"
              className={`w-full px-3 py-1.5 text-xs rounded-sm bg-sunken/40 border text-ink-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-all ${
                errors.contact ? 'border-status-open focus:ring-status-open' : 'border-border-subtle focus:ring-primary'
              }`}
            />
            {errors.contact && (
              <p className="text-[11px] text-status-open mt-1">{errors.contact}</p>
            )}
          </div>
        </div>

        {/* 2-Column: Category & Ward Combobox */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-text-muted" />
                <span>Environmental Category</span>
              </span>
              {selectedCategory && (
                <span 
                  className="w-2 h-2 rounded-full inline-block shadow-xs" 
                  style={{ backgroundColor: selectedCategory.color_hex }}
                />
              )}
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className={`w-full px-2.5 py-1.5 text-xs rounded-sm bg-sunken/40 border text-ink-primary focus:outline-none focus:ring-1 transition-all ${
                errors.category_id ? 'border-status-open focus:ring-status-open' : 'border-border-subtle focus:ring-primary'
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
              <p className="text-[11px] text-status-open mt-1">{errors.category_id}</p>
            )}

            {/* Category Authority & SLA hint */}
            {selectedCategory && (
              <div className="mt-1.5 p-1.5 bg-sunken/50 rounded text-[10px] text-text-secondary space-y-0.5 border border-border-subtle/60">
                <div className="flex items-center gap-1.5">
                  <CategoryIcon name={selectedCategory.icon} className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{selectedCategory.description}</span>
                </div>
                <div className="flex items-center justify-between pt-0.5 text-text-muted font-mono">
                  <span>Authority: {selectedCategory.responsible_authority_name || selectedCategory.authority_name || 'Mysuru City Corporation'}</span>
                  {selectedCategory.sla_hours && <span>SLA: {selectedCategory.sla_hours}h</span>}
                </div>
              </div>
            )}
          </div>

          {/* Searchable Ward Combobox */}
          <div>
            <WardCombobox
              locations={locations}
              value={formData.location_id}
              onChange={(id) => setFormData({ ...formData, location_id: id })}
              error={errors.location_id}
            />
            {errors.location_id && (
              <p className="text-[11px] text-status-open mt-1">{errors.location_id}</p>
            )}
          </div>
        </div>

        {/* Landmark / Specific Location Note */}
        <div>
          <label className="block text-xs font-semibold text-ink-primary mb-1 flex items-center gap-1.5 font-mono">
            <MapPin className="w-3.5 h-3.5 text-text-muted" />
            <span>Specific Spot / Landmark (Optional, max 120 chars)</span>
          </label>
          <input
            type="text"
            maxLength={120}
            value={formData.landmark}
            onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
            placeholder="e.g. Opposite Suburb Bus Stand, near 4th Cross junction"
            className="w-full px-3 py-1.5 text-xs rounded-sm bg-sunken/40 border border-border-subtle text-ink-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Severity Segmented Control with 1-line civic explanations */}
        <div>
          <label className="block text-xs font-semibold text-ink-primary mb-1 font-mono">
            Civic Severity Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {severities.map((sev) => {
              const isSelected = formData.severity === sev;
              let activeBorder = 'border-severity-low bg-severity-low-soft text-severity-low';
              if (sev === 'Medium') activeBorder = 'border-severity-medium bg-severity-medium-soft text-severity-medium';
              if (sev === 'High') activeBorder = 'border-severity-high bg-severity-high-soft text-severity-high';

              return (
                <button
                  type="button"
                  key={sev}
                  onClick={() => setFormData({ ...formData, severity: sev })}
                  className={`p-2 rounded-sm border text-left transition-all ${
                    isSelected
                      ? `${activeBorder} ring-1 ring-current font-medium`
                      : 'border-border-subtle bg-sunken/30 text-text-secondary hover:text-ink-primary hover:bg-sunken/60'
                  }`}
                >
                  <div className="text-xs font-semibold font-mono">{sev}</div>
                  <div className="text-[10px] text-text-muted mt-0.5 leading-tight">
                    {SEVERITY_DESCRIPTIONS[sev] || ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Observation Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-ink-primary flex items-center gap-1.5 font-mono">
              <FileText className="w-3.5 h-3.5 text-text-muted" />
              <span>Observation Description</span>
            </label>
            <span className={`text-[11px] tabular-nums font-mono ${
              formData.description.length < 20
                ? 'text-status-open'
                : formData.description.length > 1900
                  ? 'text-status-open'
                  : 'text-text-muted'
            }`}>
              {formData.description.length}/2000 (min 20)
            </span>
          </div>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the environmental issue, specific street cross, duration, or immediate hazard..."
            className={`w-full px-3 py-2 text-xs rounded-sm bg-sunken/40 border text-ink-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-all resize-none ${
              errors.description ? 'border-status-open focus:ring-status-open' : 'border-border-subtle focus:ring-primary'
            }`}
          />
          {errors.description && (
            <p className="text-[11px] text-status-open mt-1">{errors.description}</p>
          )}
        </div>

        {/* Optional Photo Upload */}
        <div>
          <label className="block text-xs font-semibold text-ink-primary mb-1 flex items-center gap-1.5 font-mono">
            <Camera className="w-3.5 h-3.5 text-text-muted" />
            <span>Photo Evidence (Optional, resized on device to max 1600px)</span>
          </label>

          {photoPreview ? (
            <div className="relative inline-block border border-border-subtle rounded-md overflow-hidden bg-sunken p-1">
              <img 
                src={photoPreview} 
                alt="Evidence preview" 
                className="w-32 h-24 object-cover rounded" 
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-status-open transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-border-strong rounded-sm p-3 text-center cursor-pointer hover:bg-sunken/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
                <Camera className="w-4 h-4 text-text-muted" />
                <span>Click to attach photo evidence (JPEG / PNG / WebP)</span>
              </div>
            </div>
          )}

          {errors.photo && (
            <p className="text-[11px] text-status-open mt-1">{errors.photo}</p>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-ink-primary hover:bg-sunken border border-border-subtle transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingPhoto}
            className="px-4 py-2 rounded-md text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Registering Report...' : 'Submit Observation Report'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
