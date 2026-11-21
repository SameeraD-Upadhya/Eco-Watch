import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Map as MapIcon, 
  Table, 
  Info, 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  Compass, 
  AlertCircle, 
  X,
  ChevronRight
} from 'lucide-react';
import { geoMercator, geoPath } from 'd3-geo';
import wardBoundariesGeoJson from '../../data/mysuru-ward-boundaries.json';
import { api } from '../../services/api';

const SVG_WIDTH = 720;
const SVG_HEIGHT = 520;

// Choropleth Color Scale (Warm Paper Civic green progression)
function getChoroplethColor(count, maxCount) {
  if (!count || count === 0) return '#F3EFE6'; // Light tinted paper
  const ratio = Math.min(1, count / Math.max(1, maxCount));
  if (ratio < 0.2) return '#D9E8DD';
  if (ratio < 0.45) return '#ADCDB8';
  if (ratio < 0.75) return '#5F9575';
  return '#2F5D46'; // Forest Green
}

export const HotspotMap = ({ 
  wardPoints = [], 
  unmappedWards = [], 
  onSelectWard 
}) => {
  const [selectedWard, setSelectedWard] = useState(null);
  const [hoveredWard, setHoveredWard] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'table'
  const [landmarks, setLandmarks] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);

  // Load landmarks from MongoDB (collection landmarks)
  useEffect(() => {
    let active = true;
    async function fetchLandmarks() {
      try {
        const data = await api.getLandmarks();
        if (active && Array.isArray(data)) {
          setLandmarks(data);
        }
      } catch (err) {
        console.warn('Could not load landmarks:', err);
      }
    }
    fetchLandmarks();
    return () => { active = false; };
  }, []);

  // Keyboard navigation & Escape key close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedWard(null);
        setHoveredWard(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate Projection and Path Generator
  const { projection, pathGenerator } = useMemo(() => {
    const proj = geoMercator().fitSize([SVG_WIDTH - 40, SVG_HEIGHT - 40], wardBoundariesGeoJson);
    proj.translate([proj.translate()[0] + 20, proj.translate()[1] + 20]);
    const path = geoPath().projection(proj);
    return { projection: proj, pathGenerator: path };
  }, []);

  // Map points index by ward_no and ward_name for quick lookup
  const pointsMap = useMemo(() => {
    const m = new Map();
    wardPoints.forEach((p) => {
      if (p.ward_no) m.set(`no-${p.ward_no}`, p);
      if (p.ward_name) m.set(`name-${p.ward_name.toLowerCase().trim()}`, p);
    });
    return m;
  }, [wardPoints]);

  const maxCount = useMemo(() => {
    return wardPoints.reduce((max, p) => Math.max(max, p.count || 0), 1);
  }, [wardPoints]);

  // Pan and Zoom Controls
  const handleZoomIn = () => setZoom((z) => Math.min(3.5, Number((z + 0.3).toFixed(1))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.9, Number((z - 0.3).toFixed(1))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse drag pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: Math.min(rect.width - 200, Math.max(10, e.clientX - rect.left + 15)),
        y: Math.min(rect.height - 110, Math.max(10, e.clientY - rect.top - 80))
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Match GeoJSON feature to data point
  const getFeatureData = (feature) => {
    const wardNo = feature.properties?.ward_no;
    const wardName = feature.properties?.ward_name;
    const byNo = wardNo ? pointsMap.get(`no-${wardNo}`) : null;
    if (byNo) return byNo;
    const byName = wardName ? pointsMap.get(`name-${wardName.toLowerCase().trim()}`) : null;
    if (byName) return byName;

    return {
      ward_no: wardNo,
      ward_name: wardName || `Ward #${wardNo}`,
      zone: feature.properties?.zone || 'General',
      count: 0,
      open_count: 0,
      resolved_count: 0,
      top_category: 'No reports',
      top_category_color: 'var(--border-subtle)',
      lat: feature.properties?.centroid?.[1],
      lng: feature.properties?.centroid?.[0]
    };
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 flex flex-col space-y-3.5">
      {/* Header & Controls */}
      <div className="border-b border-border-subtle pb-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
              Mysuru City Corporation: 65-Ward Offline Choropleth & Hotspots
            </h3>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary-soft text-primary border border-primary/20">
              65 Wards Verified
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            Offline vector choropleth projected from MCC ward boundaries. Centroid markers scale with volume.
          </p>
        </div>

        {/* View Switcher and Reset */}
        <div className="flex items-center gap-2">
          {unmappedWards.length > 0 && (
            <span className="text-[10px] text-status-medium bg-status-medium-soft px-2 py-0.5 rounded border border-status-medium/30 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3 h-3" />
              <span>{unmappedWards.length} Unmapped Wards</span>
            </span>
          )}

          <div className="flex items-center gap-1 bg-sunken p-0.5 rounded border border-border-subtle text-xs font-medium">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-surface text-ink-primary font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-ink-primary'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Choropleth</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-surface text-ink-primary font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-ink-primary'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabular Roster</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="space-y-3">
          {/* Main Map Box */}
          <div 
            ref={mapContainerRef}
            className={`relative w-full aspect-[4/3] max-h-[520px] bg-sunken/40 border border-border-subtle rounded-md overflow-hidden flex items-center justify-center select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => {
              if (e.target.tagName === 'svg' || e.target.id === 'map-background') {
                setSelectedWard(null);
              }
            }}
          >
            {/* SVG Choropleth Canvas */}
            <svg 
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
              className="w-full h-full"
              aria-label="Mysuru 65 Ward Geographic Choropleth Map"
            >
              {/* Background pattern */}
              <defs>
                <pattern id="civic-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="var(--border-subtle)" strokeWidth="0.5" strokeOpacity="0.3" />
                </pattern>
              </defs>
              <rect id="map-background" width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#civic-grid)" />

              {/* Transform group for Pan and Zoom */}
              <g 
                transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} 
                style={{ transformOrigin: 'center' }}
              >
                {/* 1. Ward Polygons (Choropleth Fills) */}
                {wardBoundariesGeoJson.features.map((feature) => {
                  const d = pathGenerator(feature);
                  if (!d) return null;
                  const data = getFeatureData(feature);
                  const isSelected = selectedWard?.ward_no === data.ward_no;
                  const isHovered = hoveredWard?.ward_no === data.ward_no;
                  const fillColor = getChoroplethColor(data.count, maxCount);

                  return (
                    <path
                      key={feature.id || `ward-${data.ward_no}`}
                      d={d}
                      data-ward-no={data.ward_no}
                      fill={fillColor}
                      fillOpacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
                      stroke={isSelected ? 'var(--color-primary)' : isHovered ? 'var(--ink-primary)' : 'var(--border-subtle)'}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.8}
                      className="ward-polygon transition-colors duration-150 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWard(data);
                      }}
                      onMouseEnter={() => setHoveredWard(data)}
                      onMouseLeave={() => setHoveredWard(null)}
                    />
                  );
                })}

                {/* 2. Ward Centroid Numbers and Incident Dots */}
                {wardBoundariesGeoJson.features.map((feature) => {
                  const data = getFeatureData(feature);
                  const centroid = feature.properties?.centroid;
                  if (!centroid) return null;
                  const [cx, cy] = projection(centroid);
                  if (isNaN(cx) || isNaN(cy)) return null;

                  const hasReports = data.count > 0;
                  const dotRadius = hasReports
                    ? Math.min(18, Math.max(5, 5 + (data.count / maxCount) * 13))
                    : 0;
                  const isSelected = selectedWard?.ward_no === data.ward_no;
                  const isHovered = hoveredWard?.ward_no === data.ward_no;

                  return (
                    <g 
                      key={`centroid-${data.ward_no}`}
                      transform={`translate(${cx}, ${cy})`}
                      className="pointer-events-none"
                    >
                      {/* Proportional Category Dot */}
                      {hasReports && (
                        <circle
                          r={dotRadius}
                          fill={data.top_category_color || 'var(--color-primary)'}
                          fillOpacity={0.85}
                          stroke="#FFFFFF"
                          strokeWidth={isSelected || isHovered ? 2 : 1}
                          style={{
                            transformBox: 'fill-box',
                            transformOrigin: 'center'
                          }}
                        />
                      )}

                      {/* Ward Number Label */}
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={dotRadius > 10 ? '9' : '8'}
                        fontFamily="var(--font-mono)"
                        fontWeight="bold"
                        fill={hasReports && dotRadius > 10 ? '#FFFFFF' : 'var(--ink-primary)'}
                      >
                        {data.ward_no}
                      </text>
                    </g>
                  );
                })}

                {/* 3. Reference Civic Landmarks */}
                {landmarks.map((lm) => {
                  const pt = projection([lm.lng, lm.lat]);
                  if (!pt || isNaN(pt[0]) || isNaN(pt[1])) return null;
                  const [lx, ly] = pt;

                  return (
                    <g key={lm.name} className="pointer-events-none">
                      <circle cx={lx} cy={ly} r="3" fill="var(--color-accent)" stroke="#FFFFFF" strokeWidth="1" />
                      <text
                        x={lx + 5}
                        y={ly + 3}
                        fontSize="8.5"
                        fontFamily="var(--font-serif)"
                        fontWeight="600"
                        fill="var(--ink-primary)"
                        className="drop-shadow-xs"
                      >
                        {lm.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Pan & Zoom On-Canvas Controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1 bg-surface/90 backdrop-blur-xs border border-border-subtle rounded-md shadow-sm p-1 z-10">
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-sunken text-ink-primary transition-colors"
                title="Zoom In (+)"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-sunken text-ink-primary transition-colors"
                title="Zoom Out (-)"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-sunken text-text-secondary hover:text-ink-primary transition-colors text-[10px] font-mono font-bold"
                title="Reset View"
                aria-label="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hover Tooltip (Never covers the hovered dot) */}
            {hoveredWard && !selectedWard && (
              <div 
                style={{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }}
                className="absolute pointer-events-none bg-surface/95 border border-border-strong rounded-md shadow-md p-2 text-xs z-20 space-y-0.5"
              >
                <div className="font-serif font-bold text-ink-primary flex items-center gap-1.5">
                  <span className="font-mono text-[10px] bg-sunken px-1 rounded">#{hoveredWard.ward_no}</span>
                  <span>{hoveredWard.ward_name}</span>
                </div>
                <div className="text-[11px] font-mono text-text-secondary">
                  <span>{hoveredWard.zone}</span> • <strong>{hoveredWard.count}</strong> reports
                </div>
                {hoveredWard.count > 0 && (
                  <div className="text-[10px] text-text-muted">
                    Dominant: <strong className="text-ink-primary">{hoveredWard.top_category}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Floating Detail Card for Desktop (>=640px) */}
            {selectedWard && (
              <div className="hidden sm:block absolute bottom-3 left-3 max-w-xs bg-surface border border-border-strong rounded-md shadow-lg p-3 text-xs space-y-2 z-20">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-serif font-bold text-ink-primary flex items-center gap-1.5">
                      <span className="font-mono text-[10px] bg-primary-soft text-primary px-1.5 py-0.2 rounded font-bold">
                        #{selectedWard.ward_no}
                      </span>
                      <span>{selectedWard.ward_name}</span>
                    </div>
                    <p className="text-[10px] text-text-muted font-mono mt-0.5">
                      {selectedWard.zone} • {selectedWard.count} Total Complaints
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedWard(null)}
                    className="p-1 rounded text-text-muted hover:text-ink-primary hover:bg-sunken"
                    title="Close ward details"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border-subtle font-mono text-[11px] text-center">
                  <div className="p-1.5 bg-status-open-soft rounded">
                    <span className="block text-[9px] text-status-open">OPEN</span>
                    <strong className="text-status-open">{selectedWard.open_count}</strong>
                  </div>
                  <div className="p-1.5 bg-status-resolved-soft rounded">
                    <span className="block text-[9px] text-status-resolved">RESOLVED</span>
                    <strong className="text-status-resolved">{selectedWard.resolved_count}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-text-secondary border-t border-border-subtle pt-1.5">
                  <span className="text-text-muted">Prevailing Hazard:</span> <strong>{selectedWard.top_category}</strong>
                </div>

                {onSelectWard && (
                  <button
                    type="button"
                    onClick={() => onSelectWard(selectedWard.ward_name)}
                    className="w-full py-1.5 px-2.5 rounded-sm bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Filter className="w-3 h-3" />
                    <span>Filter Tracker to this Ward</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Docked Detail Card for Mobile (<640px) */}
          {selectedWard && (
            <div className="sm:hidden bg-surface border border-border-strong rounded-md shadow-sm p-3.5 text-xs space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-serif font-bold text-ink-primary flex items-center gap-1.5">
                    <span className="font-mono text-[10px] bg-primary-soft text-primary px-1.5 py-0.5 rounded font-bold">
                      #{selectedWard.ward_no}
                    </span>
                    <span>{selectedWard.ward_name}</span>
                  </div>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    {selectedWard.zone} • {selectedWard.count} Complaints
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedWard(null)}
                  className="p-1 rounded text-text-muted hover:text-ink-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-1.5 bg-status-open-soft rounded">
                  <span className="block text-[9px] text-status-open">OPEN</span>
                  <strong className="text-status-open">{selectedWard.open_count}</strong>
                </div>
                <div className="p-1.5 bg-status-resolved-soft rounded">
                  <span className="block text-[9px] text-status-resolved">RESOLVED</span>
                  <strong className="text-status-resolved">{selectedWard.resolved_count}</strong>
                </div>
              </div>

              {onSelectWard && (
                <button
                  type="button"
                  onClick={() => onSelectWard(selectedWard.ward_name)}
                  className="w-full py-2 px-3 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter Tracker to this Ward</span>
                </button>
              )}
            </div>
          )}

          {/* Visual Legend Bar */}
          <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 flex-wrap gap-2.5">
            {/* Choropleth Steps */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase font-semibold">Density:</span>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className="w-3.5 h-3.5 rounded-sm border border-border-subtle" style={{ backgroundColor: '#F3EFE6' }} title="0 reports" />
                <span className="text-text-muted">0</span>
                <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#D9E8DD' }} title="Low" />
                <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#ADCDB8' }} title="Moderate" />
                <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#5F9575' }} title="High" />
                <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#2F5D46' }} title="Peak" />
                <span className="text-text-muted">{maxCount}+</span>
              </div>
            </div>

            {/* Landmarks & Centroid Explanation */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block border border-white" />
                <span>Verified Landmarks ({landmarks.length})</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block border border-white" />
                <span>Incident Centroids</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto border border-border-subtle rounded-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-sunken/40 text-text-muted font-mono text-[10px] uppercase">
                <th className="py-2 px-3">Ward #</th>
                <th className="py-2 px-3">Ward Name</th>
                <th className="py-2 px-3">Zone</th>
                <th className="py-2 px-3 text-center">Complaints</th>
                <th className="py-2 px-3 text-center">Open</th>
                <th className="py-2 px-3 text-center">Resolved</th>
                <th className="py-2 px-3">Prevailing Issue</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {wardPoints.map((p) => (
                <tr key={p.ward_name} className="hover:bg-sunken/30 transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-ink-primary">
                    #{p.ward_no || '–'}
                  </td>
                  <td className="py-2 px-3 font-medium text-ink-primary">
                    {p.ward_name}
                  </td>
                  <td className="py-2 px-3 font-mono text-text-secondary">
                    {p.zone}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-ink-primary">
                    {p.count}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-status-open">
                    {p.open_count}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-status-resolved">
                    {p.resolved_count}
                  </td>
                  <td className="py-2 px-3 font-serif text-ink-primary">
                    {p.top_category !== 'None' && (
                      <span 
                        className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                        style={{ backgroundColor: p.top_category_color }}
                      />
                    )}
                    {p.top_category}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {onSelectWard && p.count > 0 && (
                      <button
                        onClick={() => onSelectWard(p.ward_name)}
                        className="text-[11px] text-primary hover:text-primary-hover font-medium underline transition-colors"
                      >
                        Filter Tracker
                      </button>
                    )}
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
