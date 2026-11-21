import React, { useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { api } from '../../services/api';

const PRESET_CIVIC_COLORS = [
  '#2F5D46', // Forest Green
  '#3F7D5A', // Sage Green
  '#2F6F8F', // Slate Blue
  '#B7791F', // Turmeric / Ochre
  '#A8322B', // Brick Red
  '#4A574F', // Deep Olive Grey
  '#8C5E32', // Warm Sienna
  '#5A6B5C', // Moss
];

export const CategoryManager = ({ categories = [], onCategoryAdded, addToast }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colorHex, setColorHex] = useState('#2F5D46');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.createCategory({
        name: name.trim(),
        description: description.trim(),
        color_hex: colorHex
      });
      setName('');
      setDescription('');
      addToast(`Category "${name}" created successfully`);
      if (onCategoryAdded) onCategoryAdded();
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4.5 space-y-4">
      <div className="border-b border-border-subtle pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold font-serif text-ink-primary flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span>Environmental Categories</span>
          </h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Categories govern classification and live chart analytics colours.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-sunken px-2 py-0.5 rounded border border-border-subtle text-text-secondary">
          {categories.length} total
        </span>
      </div>

      {/* Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-3 bg-sunken/40 p-3 rounded-md border border-border-subtle">
        <div className="text-xs font-semibold text-ink-primary font-mono">Add New Category</div>
        {error && (
          <div className="p-2 rounded text-[11px] bg-status-open-soft border border-status-open/30 text-status-open">
            {error}
          </div>
        )}

        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category Name"
            className="w-full px-2.5 py-1.5 text-xs rounded-sm bg-surface border border-border-subtle text-ink-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope description (optional)"
            className="w-full px-2.5 py-1.5 text-xs rounded-sm bg-surface border border-border-subtle text-ink-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Color Picker with Civic Presets */}
        <div>
          <div className="flex items-center justify-between mb-1 text-[11px] text-text-secondary font-mono">
            <span>Palette Token:</span>
            <span>{colorHex}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_CIVIC_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColorHex(c)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  colorHex.toLowerCase() === c.toLowerCase() 
                    ? 'border-ink-primary scale-110 shadow-xs' 
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-5 h-5 p-0 border-0 rounded cursor-pointer ml-1 bg-transparent"
              title="Custom hex color"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-1.5 px-3 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{loading ? 'Creating...' : 'Register Category'}</span>
        </button>
      </form>

      {/* Live List from MongoDB */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {categories.length === 0 ? (
          <div className="text-center py-5 text-xs text-text-muted">
            No categories registered yet in MongoDB.
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2 rounded-sm bg-surface border border-border-subtle text-xs hover:border-border-strong transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: cat.color_hex }}
                />
                <div className="min-w-0">
                  <p className="font-medium text-ink-primary truncate">{cat.name}</p>
                  {cat.description && (
                    <p className="text-[11px] text-text-secondary truncate">{cat.description}</p>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono text-text-muted shrink-0 pl-2">
                {cat.created_at ? new Date(cat.created_at).toLocaleDateString() : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
