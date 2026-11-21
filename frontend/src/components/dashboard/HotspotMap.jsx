import React, { useState } from 'react';
import { Map, Table, Info, MapPin, Eye } from 'lucide-react';

// Mysuru Geographic Coordinate Boundaries
const BOUNDS = {
  minLat: 12.250,
  maxLat: 12.385,
  minLng: 76.570,
  maxLng: 76.710
};

// Major Mysuru Civic Reference Landmarks
const LANDMARKS = [
  { name: 'Mysuru Palace', lat: 12.3051, lng: 76.6551 },
  { name: 'Chamundi Hill', lat: 12.2750, lng: 76.6700 },
  { name: 'Kukkarahalli Lake', lat: 12.3100, lng: 76.6280 },
  { name: 'Hebbal Industrial Area', lat: 12.3600, lng: 76.6020 }
];

function projectCoords(lat, lng, width = 600, height = 440) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (width - 60) + 30;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (height - 60) + 30;
  return { x: Math.max(20, Math.min(width - 20, x)), y: Math.max(20, Math.min(height - 20, y)) };
}

export const HotspotMap = ({ wardPoints = [] }) => {
  const [selectedWard, setSelectedWard] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'table'

  const maxCount = wardPoints.reduce((max, p) => Math.max(max, p.count), 1);

  return (
    <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 flex flex-col">
      <div className="border-b border-border-subtle pb-2.5 mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
              Mysuru Ward Geographic Hotspot Map
            </h3>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-sunken border border-border-subtle text-text-secondary">
              {wardPoints.length} Wards Active
            </span>
          </div>
          <p className="text-[11px] text-text-muted">
            Centroid clusters sized by complaint volume and color-coded by prevailing issue
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-sunken p-0.5 rounded border border-border-subtle text-xs font-medium">
          <button
            onClick={() => setViewMode('map')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              viewMode === 'map'
                ? 'bg-surface text-ink-primary font-semibold shadow-2xs'
                : 'text-text-secondary hover:text-ink-primary'
            }`}
          >
            <Map className="w-3 h-3" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              viewMode === 'table'
                ? 'bg-surface text-ink-primary font-semibold shadow-2xs'
                : 'text-text-secondary hover:text-ink-primary'
            }`}
          >
            <Table className="w-3 h-3" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="space-y-3">
          {/* SVG Map Container */}
          <div className="relative w-full aspect-[4/3] max-h-[460px] bg-sunken/40 border border-border-subtle rounded-md overflow-hidden flex items-center justify-center">
            <svg 
              viewBox="0 0 600 440" 
              className="w-full h-full select-none"
              aria-label="Mysuru Ward Centroid Map"
            >
              {/* Subtle Grid Coordinates */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-subtle)" strokeWidth="0.5" strokeOpacity="0.4" />
                </pattern>
              </defs>
              <rect width="600" height="440" fill="url(#grid)" />

              {/* Geographic Landmarks */}
              {LANDMARKS.map((lm) => {
                const { x, y } = projectCoords(lm.lat, lm.lng);
                return (
                  <g key={lm.name} className="opacity-60">
                    <circle cx={x} cy={y} r="2.5" fill="var(--text-muted)" />
                    <text 
                      x={x + 4} 
                      y={y + 3} 
                      fontSize="9" 
                      fontFamily="var(--font-sans)" 
                      fill="var(--text-muted)"
                      className="font-medium"
                    >
                      {lm.name}
                    </text>
                  </g>
                );
              })}

              {/* Ward Incident Centroid Circles */}
              {wardPoints.map((p) => {
                const { x, y } = projectCoords(p.lat, p.lng);
                const radius = Math.min(22, Math.max(6, 6 + (p.count / maxCount) * 16));
                const isSelected = selectedWard?.ward_name === p.ward_name;

                return (
                  <g 
                    key={p.ward_name}
                    onClick={() => setSelectedWard(p)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r={radius + 5}
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}

                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={p.top_category_color || '#2F5D46'}
                      fillOpacity={isSelected ? 0.95 : 0.75}
                      stroke="var(--color-primary-dark)"
                      strokeWidth={isSelected ? 2 : 1}
                      className="transition-all duration-200 group-hover:scale-110"
                    />

                    {/* Report count label inside circle */}
                    <text
                      x={x}
                      y={y + 3.5}
                      textAnchor="middle"
                      fontSize={radius > 12 ? '10' : '8'}
                      fontFamily="var(--font-mono)"
                      fill="#FFFFFF"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {p.count}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Selected Ward Detail Card Popover */}
            {selectedWard && (
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-surface border border-border-strong rounded-md shadow-lg p-3 text-xs space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-serif font-bold text-ink-primary">
                      {selectedWard.ward_name}
                    </span>
                    <p className="text-[10px] text-text-muted font-mono">
                      {selectedWard.zone} • Lat: {selectedWard.lat}, Lng: {selectedWard.lng}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedWard(null)}
                    className="text-text-muted hover:text-ink-primary font-bold text-sm px-1"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-border-subtle font-mono text-[11px] text-center">
                  <div className="p-1.5 bg-sunken rounded">
                    <span className="block text-[9px] text-text-muted">TOTAL</span>
                    <span className="font-bold text-ink-primary">{selectedWard.count}</span>
                  </div>
                  <div className="p-1.5 bg-status-open-soft rounded">
                    <span className="block text-[9px] text-status-open">OPEN</span>
                    <span className="font-bold text-status-open">{selectedWard.open_count}</span>
                  </div>
                  <div className="p-1.5 bg-status-resolved-soft rounded">
                    <span className="block text-[9px] text-status-resolved">RESOLVED</span>
                    <span className="font-bold text-status-resolved">{selectedWard.resolved_count}</span>
                  </div>
                </div>

                <div className="text-[11px] text-text-secondary">
                  <strong>Dominant Issue:</strong> {selectedWard.top_category}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Click any circle to view ward-level incident breakdown
            </span>
            <span>Centroid scale: 6px–22px</span>
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted font-mono text-[10px] uppercase">
                <th className="py-2 px-2.5">Ward</th>
                <th className="py-2 px-2.5">Zone</th>
                <th className="py-2 px-2.5 text-center">Total</th>
                <th className="py-2 px-2.5 text-center">Open</th>
                <th className="py-2 px-2.5 text-center">Resolved</th>
                <th className="py-2 px-2.5">Dominant Issue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {wardPoints.map((p) => (
                <tr key={p.ward_name} className="hover:bg-sunken/20">
                  <td className="py-2 px-2.5 font-medium text-ink-primary">
                    {p.ward_name}
                  </td>
                  <td className="py-2 px-2.5 font-mono text-text-secondary">
                    {p.zone}
                  </td>
                  <td className="py-2 px-2.5 text-center font-mono font-bold text-ink-primary">
                    {p.count}
                  </td>
                  <td className="py-2 px-2.5 text-center font-mono text-status-open">
                    {p.open_count}
                  </td>
                  <td className="py-2 px-2.5 text-center font-mono text-status-resolved">
                    {p.resolved_count}
                  </td>
                  <td className="py-2 px-2.5 font-serif text-ink-primary">
                    <span 
                      className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                      style={{ backgroundColor: p.top_category_color }}
                    />
                    {p.top_category}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
