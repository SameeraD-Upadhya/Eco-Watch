import React, { useState } from 'react';
import { CategoryManager } from './CategoryManager';
import { LocationManager } from './LocationManager';
import { BulkImportPanel } from './BulkImportPanel';
import { Database, UploadCloud, Layers } from 'lucide-react';

export const MasterDataManager = ({ 
  categories = [], 
  locations = [], 
  onRefresh, 
  addToast 
}) => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="border-b border-border-subtle pb-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Master Data & Ingestion Manager</h1>
          <p className="text-xs text-text-secondary mt-1">
            Dynamic schema governance: register categories and municipal wards, or ingest historical datasets.
          </p>
        </div>

        {/* View Filter Switcher */}
        <div className="flex items-center gap-1 bg-surface border border-border-subtle p-1 rounded-md text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'all' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            All Controls
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'categories' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'locations' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Wards ({locations.length})
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'import' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Bulk Ingest
          </button>
        </div>
      </div>

      {/* Side-by-side or Grid Controls */}
      {(activeTab === 'all' || activeTab === 'categories' || activeTab === 'locations') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <div className="mt-6">
          <BulkImportPanel
            onImportComplete={onRefresh}
            addToast={addToast}
          />
        </div>
      )}
    </div>
  );
};
