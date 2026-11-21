import React, { useState, useRef } from 'react';
import { UploadCloud, Download, RefreshCw, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export const BulkImportPanel = ({ onImportComplete, addToast }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.json') && !name.endsWith('.csv')) {
      setError('Only .json and .csv files are supported.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setResult(null);

    // Read first few lines for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        if (name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const list = Array.isArray(parsed) ? parsed : (parsed.reports || []);
          setPreviewRows(list.slice(0, 3));
        } else {
          const lines = text.split('\n').filter(Boolean);
          const headers = lines[0].split(',').map(h => h.trim());
          const rows = lines.slice(1, 4).map(l => {
            const vals = l.split(',');
            const rowObj = {};
            headers.forEach((h, i) => { rowObj[h] = vals[i] || ''; });
            return rowObj;
          });
          setPreviewRows(rows);
        }
      } catch {
        setPreviewRows([]);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const executeImport = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.bulkImportReports(selectedFile);
      setResult(res);
      addToast(`Import finished: ${res.inserted} inserted, ${res.skipped} skipped`);
      if (onImportComplete) onImportComplete();
    } catch (err) {
      setError(err.message || 'Bulk import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = (type) => {
    const filename = type === 'json' ? 'sample-reports.json' : 'sample-reports.csv';
    const a = document.createElement('a');
    a.href = `/docs/${filename}`;
    a.download = filename;
    a.click();
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4.5 space-y-4">
      <div className="border-b border-border-subtle pb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold font-serif text-ink-primary flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-primary" />
            <span>Bulk Dataset Ingestion (JSON / CSV)</span>
          </h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Ingest municipal records with automated category and ward reference resolution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadSample('json')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sunken border border-border-subtle text-[11px] font-medium text-text-secondary hover:text-ink-primary transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Template .json</span>
          </button>
          <button
            onClick={() => handleDownloadSample('csv')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sunken border border-border-subtle text-[11px] font-medium text-text-secondary hover:text-ink-primary transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Template .csv</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-md text-xs bg-status-open-soft border border-status-open/30 text-status-open flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Target */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-primary bg-primary-soft'
            : 'border-border-strong bg-sunken/30 hover:bg-sunken/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
        <UploadCloud className="w-7 h-7 text-text-muted mx-auto mb-2" />
        <p className="text-xs font-semibold text-ink-primary font-serif">
          {selectedFile ? selectedFile.name : 'Drag & drop JSON or CSV file here, or click to browse'}
        </p>
        <p className="text-[11px] text-text-muted mt-1 font-mono">
          Required fields: citizen_name, category_name, location_name, description, severity
        </p>
      </div>

      {/* File Preview */}
      {previewRows.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider font-mono">
            Sample File Preview (First {previewRows.length} Records)
          </div>
          <div className="overflow-x-auto border border-border-subtle rounded-sm bg-sunken/30 text-[11px]">
            <table className="w-full text-left">
              <thead className="bg-sunken border-b border-border-subtle text-text-muted font-mono">
                <tr>
                  <th className="p-2 font-medium">Citizen</th>
                  <th className="p-2 font-medium">Category</th>
                  <th className="p-2 font-medium">Ward</th>
                  <th className="p-2 font-medium">Severity</th>
                  <th className="p-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono text-[10px]">
                {previewRows.map((r, i) => (
                  <tr key={i} className="hover:bg-surface/50">
                    <td className="p-2 font-sans font-medium text-ink-primary">{r.citizen_name || '-'}</td>
                    <td className="p-2">{r.category_name || r.category || '-'}</td>
                    <td className="p-2">{r.location_name || r.ward_name || r.ward || '-'}</td>
                    <td className="p-2">{r.severity || 'Medium'}</td>
                    <td className="p-2 max-w-xs truncate">{r.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={executeImport}
            disabled={loading}
            className="w-full py-2 px-3.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Processing Import...' : `Ingest Dataset (${selectedFile?.name})`}</span>
          </button>
        </div>
      )}

      {/* Import Result Summary & Error Table */}
      {result && (
        <div className="space-y-3 pt-3 border-t border-border-subtle">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-md bg-sunken border border-border-subtle text-center">
              <div className="text-[11px] text-text-muted font-mono">Total Rows</div>
              <div className="text-base font-bold tabular-nums text-ink-primary font-serif">{result.total_rows}</div>
            </div>
            <div className="p-2.5 rounded-md bg-status-resolved-soft border border-status-resolved/30 text-center">
              <div className="text-[11px] text-status-resolved font-mono">Inserted</div>
              <div className="text-base font-bold tabular-nums text-status-resolved font-serif">{result.inserted}</div>
            </div>
            <div className="p-2.5 rounded-md bg-status-open-soft border border-status-open/30 text-center">
              <div className="text-[11px] text-status-open font-mono">Skipped</div>
              <div className="text-base font-bold tabular-nums text-status-open font-serif">{result.skipped}</div>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-status-open flex items-center gap-1.5 font-mono">
                <XCircle className="w-3.5 h-3.5" />
                <span>Per-Row Error Table ({result.errors.length} failed)</span>
              </div>
              <div className="max-h-36 overflow-y-auto border border-status-open/30 rounded-sm bg-status-open-soft/30 text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-status-open-soft border-b border-status-open/30 text-status-open font-mono text-[10px]">
                    <tr>
                      <th className="p-1.5 w-14">Row #</th>
                      <th className="p-1.5">Validation Failure</th>
                      <th className="p-1.5">Data Excerpt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-status-open/20 font-mono text-[10px]">
                    {result.errors.map((err, i) => (
                      <tr key={i}>
                        <td className="p-1.5 font-bold">{err.row}</td>
                        <td className="p-1.5 text-status-open">{err.error}</td>
                        <td className="p-1.5 max-w-xs truncate text-text-muted">{JSON.stringify(err.data || {})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
