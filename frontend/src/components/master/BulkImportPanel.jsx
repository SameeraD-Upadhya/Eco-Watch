import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Download, RefreshCw, XCircle } from 'lucide-react';
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
      } catch (err) {
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
    <div className="bg-surface border border-border-subtle rounded-lg shadow-e1 p-5 space-y-5">
      <div className="border-b border-border-subtle pb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            <span>Bulk Dataset Ingestion (JSON / CSV)</span>
          </h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Ingest municipal records with automated category and ward reference resolution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadSample('json')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-app border border-border-subtle text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Template .json</span>
          </button>
          <button
            onClick={() => handleDownloadSample('csv')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-app border border-border-subtle text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Template .csv</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md text-xs bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
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
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-border-strong bg-app/30 hover:bg-app/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
        <UploadCloud className="w-8 h-8 text-text-muted mx-auto mb-2" />
        <p className="text-xs font-semibold text-text-primary">
          {selectedFile ? selectedFile.name : 'Drag & drop JSON or CSV file here, or click to browse'}
        </p>
        <p className="text-[11px] text-text-muted mt-1">
          Supported fields: citizen_name, category_name, location_name, description, severity
        </p>
      </div>

      {/* File Preview */}
      {previewRows.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Sample File Preview (First {previewRows.length} Records)
          </div>
          <div className="overflow-x-auto border border-border-subtle rounded-md bg-app/40 text-[11px]">
            <table className="w-full text-left">
              <thead className="bg-app border-b border-border-subtle text-text-muted">
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
                    <td className="p-2 font-sans font-medium text-text-primary">{r.citizen_name || '-'}</td>
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
            className="w-full py-2 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Processing Import...' : `Ingest Dataset (${selectedFile?.name})`}</span>
          </button>
        </div>
      )}

      {/* Import Result Summary & Error Table */}
      {result && (
        <div className="space-y-4 pt-3 border-t border-border-subtle">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-md bg-app border border-border-subtle text-center">
              <div className="text-xs text-text-muted">Total Rows</div>
              <div className="text-base font-bold tabular-nums text-text-primary">{result.total_rows}</div>
            </div>
            <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center">
              <div className="text-xs text-emerald-700 dark:text-emerald-400">Inserted</div>
              <div className="text-base font-bold tabular-nums text-emerald-800 dark:text-emerald-300">{result.inserted}</div>
            </div>
            <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center">
              <div className="text-xs text-rose-700 dark:text-rose-400">Skipped</div>
              <div className="text-base font-bold tabular-nums text-rose-800 dark:text-rose-300">{result.skipped}</div>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                <span>Per-Row Error Table ({result.errors.length} failed)</span>
              </div>
              <div className="max-h-40 overflow-y-auto border border-rose-200 dark:border-rose-900/40 rounded-md bg-rose-50/40 dark:bg-rose-950/20 text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-rose-100/50 dark:bg-rose-900/30 border-b border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300">
                    <tr>
                      <th className="p-2 w-16">Row #</th>
                      <th className="p-2">Validation Failure</th>
                      <th className="p-2">Data Excerpt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-200/50 dark:divide-rose-900/30 font-mono text-[10px]">
                    {result.errors.map((err, i) => (
                      <tr key={i}>
                        <td className="p-2 font-bold">{err.row}</td>
                        <td className="p-2 text-rose-700 dark:text-rose-400">{err.error}</td>
                        <td className="p-2 max-w-xs truncate text-text-muted">{JSON.stringify(err.data || {})}</td>
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
