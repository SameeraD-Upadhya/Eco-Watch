import React, { useState } from 'react';
import { CategoryManager } from './CategoryManager';
import { LocationManager } from './LocationManager';
import { BulkImportPanel } from './BulkImportPanel';
import { Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export const MasterDataManager = ({ 
  categories = [], 
  locations = [], 
  onRefresh, 
  addToast 
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleLoadDemoData = async () => {
    try {
      setLoadingDemo(true);
      const res = await api.loadMasterData(true);
      addToast(
        `Mysuru dataset loaded: ${res.wards_loaded} wards, ${res.categories_loaded} categories, ${res.reports_loaded} demonstration reports`
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to load demonstration data', 'error');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="border-b border-border-subtle pb-3.5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-primary font-serif">Master Data & Ingestion Manager</h1>
          <p className="text-xs text-text-secondary mt-1">
            Dynamic schema governance: register categories and municipal wards, or ingest authoritative datasets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Demo Loader Button */}
          <button
            onClick={handleLoadDemoData}
            disabled={loadingDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent hover:bg-accent/90 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            title="Idempotently seed official MCC 65 wards, categories, and 150 demonstration reports"
          >
            {loadingDemo ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{loadingDemo ? 'Loading...' : 'Load Mysuru Demo Data'}</span>
          </button>

          {/* View Filter Switcher */}
          <div className="flex items-center gap-1 bg-sunken/60 border border-border-subtle p-0.5 rounded-md text-xs font-medium">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'all' ? 'bg-surface text-ink-primary shadow-xs font-semibold' : 'text-text-secondary hover:text-ink-primary'
              }`}
            >
              All Controls
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'categories' ? 'bg-surface text-ink-primary shadow-xs font-semibold' : 'text-text-secondary hover:text-ink-primary'
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'locations' ? 'bg-surface text-ink-primary shadow-xs font-semibold' : 'text-text-secondary hover:text-ink-primary'
              }`}
            >
              Wards ({locations.length})
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'import' ? 'bg-surface text-ink-primary shadow-xs font-semibold' : 'text-text-secondary hover:text-ink-primary'
              }`}
            >
              Bulk Ingest
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-side or Grid Controls */}
      {(activeTab === 'all' || activeTab === 'categories' || activeTab === 'locations') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {(activeTab === 'all' || activeTab === 'categories') && (
            <CategoryManager
              categories={categories}
              onCategoryAdded={onRefresh}
              addToast={addToast}
            />
          )}

          {(activeTab === 'all' || activeTab === 'locations') && (
            <LocationManager
              locations={locations}
              onLocationAdded={onRefresh}
              addToast={addToast}
            />
          )}
        </div>
      )}

      {(activeTab === 'all' || activeTab === 'import') && (
        <div className="mt-5">
          <BulkImportPanel
            onImportComplete={onRefresh}
            addToast={addToast}
          />
        </div>
      )}
    </div>
  );
};
