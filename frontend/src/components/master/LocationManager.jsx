import React, { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { api } from '../../services/api';

export const LocationManager = ({ locations = [], onLocationAdded, addToast }) => {
  const [wardName, setWardName] = useState('');
  const [zone, setZone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wardName.trim()) {
      setError('Ward / Locality name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.createLocation({
        ward_name: wardName.trim(),
        zone: zone.trim() || 'General'
      });
      setWardName('');
      setZone('');
      addToast(`Ward "${wardName}" registered successfully`);
      if (onLocationAdded) onLocationAdded();
    } catch (err) {
      setError(err.message || 'Failed to create location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4.5 space-y-4">
      <div className="border-b border-border-subtle pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold font-serif text-ink-primary flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>Municipal Wards & Localities</span>
          </h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Mysuru municipal divisions and jurisdictional zones.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-sunken px-2 py-0.5 rounded border border-border-subtle text-text-secondary">
          {locations.length} total
        </span>
      </div>

      {/* Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-3 bg-sunken/40 p-3 rounded-md border border-border-subtle">
        <div className="text-xs font-semibold text-ink-primary font-mono">Add New Municipal Ward</div>
        {error && (
          <div className="p-2 rounded text-[11px] bg-status-open-soft border border-status-open/30 text-status-open">
            {error}
          </div>
        )}

        <div>
          <input
            type="text"
            value={wardName}
            onChange={(e) => setWardName(e.target.value)}
            placeholder="Ward / Locality Name"
            className="w-full px-2.5 py-1.5 text-xs rounded-sm bg-surface border border-border-subtle text-ink-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <input
            type="text"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="Zone (e.g. South Zone, Central Zone)"
            className="w-full px-2.5 py-1.5 text-xs rounded-sm bg-surface border border-border-subtle text-ink-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-1.5 px-3 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{loading ? 'Registering...' : 'Register Municipal Ward'}</span>
        </button>
      </form>

      {/* Live List from MongoDB */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {locations.length === 0 ? (
          <div className="text-center py-5 text-xs text-text-muted">
            No wards registered yet in MongoDB.
          </div>
        ) : (
          locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between p-2 rounded-sm bg-surface border border-border-subtle text-xs hover:border-border-strong transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink-primary truncate">{loc.ward_name}</p>
                <p className="text-[11px] text-text-secondary truncate">{loc.zone || 'General Zone'}</p>
              </div>
              <span className="text-[10px] font-mono text-text-muted shrink-0 pl-2">
                {loc.created_at ? new Date(loc.created_at).toLocaleDateString() : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
