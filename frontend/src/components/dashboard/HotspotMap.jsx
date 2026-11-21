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
  ChevronUp,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { geoMercator, geoPath } from 'd3-geo';
import wardBoundariesGeoJson from '../../data/mysuru-ward-boundaries.json';
import { api } from '../../services/api';

const SVG_WIDTH = 720;
const SVG_HEIGHT = 520;

// Choropleth Color Scale (Warm Paper Civic green progression)
function getChoroplethColor(value, maxVal) {
  if (!value || value === 0) return '#F3EFE6'; // Light tinted paper
  const ratio = Math.min(1, value / Math.max(1, maxVal));
  if (ratio <= 0.25) return '#D9E8DD';
  if (ratio <= 0.50) return '#ADCDB8';
  if (ratio <= 0.75) return '#5F9575';
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
  const [metric, setMetric] = useState('total'); // 'total', 'open', 'in_progress'
  const [landmarks, setLandmarks] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tableSort, setTableSort] = useState({ field: 'ward_no', asc: true });
  const mapContainerRef = useRef(null);

  // Load verified landmarks from backend API
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

  // Calculate Projection and Path Generator over FULL FeatureCollection
  const { projection, pathGenerator } = useMemo(() => {
    const proj = geoMercator().fitSize([SVG_WIDTH - 40, SVG_HEIGHT - 40], wardBoundariesGeoJson);
    proj.translate([proj.translate()[0] + 20, proj.translate()[1] + 20]);
    const path = geoPath().projection(proj);
    return { projection: proj, pathGenerator: path };
  }, []);

  // Map points index by normalized ward_no (number) and ward_name for quick lookup
  const pointsMap = useMemo(() => {
    const m = new Map();
    wardPoints.forEach((p) => {
      if (p.ward_no !== null && p.ward_no !== undefined) {
        m.set(`no-${Number(p.ward_no)}`, p);
      }
      if (p.ward_name) {
        m.set(`name-${p.ward_name.toLowerCase().trim()}`, p);
      }
    });
    return m;
  }, [wardPoints]);

  // Metric value extractor
  const getMetricValue = (point) => {
    if (!point) return 0;
    if (metric === 'open') return point.open_count || 0;
    if (metric === 'in_progress') return point.in_progress_count || 0;
    return point.count || 0;
  };

  const maxMetricValue = useMemo(() => {
    return wardPoints.reduce((max, p) => Math.max(max, getMetricValue(p)), 1);
  }, [wardPoints, metric]);

  // Compute dynamic legend intervals based on actual data
  const legendIntervals = useMemo(() => {
    const max = maxMetricValue;
    if (max <= 4) {
      return { b1: 1, b2: 2, b3: 3, max };
    }
    const b1 = Math.max(1, Math.round(max * 0.25));
    const b2 = Math.max(b1 + 1, Math.round(max * 0.50));
    const b3 = Math.max(b2 + 1, Math.round(max * 0.75));
    return { b1, b2, b3, max };
  }, [maxMetricValue]);

  // Match GeoJSON feature to data point
  const getFeatureData = (feature) => {
    const rawNo = feature.properties?.ward_no;
    const wardNo = rawNo !== undefined && rawNo !== null ? Number(rawNo) : null;
    const wardName = feature.properties?.ward_name;
    const byNo = wardNo !== null ? pointsMap.get(`no-${wardNo}`) : null;
    if (byNo) return byNo;
    const byName = wardName ? pointsMap.get(`name-${wardName.toLowerCase().trim()}`) : null;
    if (byName) return byName;

    return {
      ward_no: wardNo,
      ward_name: wardName || `Ward #${wardNo}`,
      zone: feature.properties?.zone || 'General',
      count: 0,
      open_count: 0,
      in_progress_count: 0,
      resolved_count: 0,
      top_category: 'None',
      top_category_color: 'var(--border-subtle)',
      lat: feature.properties?.centroid?.[1],
      lng: feature.properties?.centroid?.[0],
      has_boundary: true
    };
  };

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
      // Keep tooltip strictly inside the frame
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const clampedX = Math.min(rect.width - 210, Math.max(10, x + 15));
      const clampedY = y > 120 ? y - 95 : y + 15;
      setTooltipPos({ x: clampedX, y: clampedY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Sourced boundaries count
  const sourcedBoundariesCount = useMemo(() => {
    return wardBoundariesGeoJson.features.filter(
      (f) => Boolean(f.properties?.source_url) || Boolean(f.properties?.kgis_ward_code)
    ).length;
  }, []);

  const totalWards = wardBoundariesGeoJson.features.length;

  // Verified landmarks count (only those with citations)
  const verifiedLandmarksCount = useMemo(() => {
    return landmarks.filter((l) => Boolean(l.source_url)).length;
  }, [landmarks]);

  // Sorted list for Tabular Roster
  const sortedRoster = useMemo(() => {
    const list = [...wardPoints];
    list.sort((a, b) => {
      let vA = a[tableSort.field];
      let vB = b[tableSort.field];
      if (typeof vA === 'string') {
        vA = vA.toLowerCase();
        vB = (vB || '').toLowerCase();
        return tableSort.asc ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      vA = vA || 0;
      vB = vB || 0;
      return tableSort.asc ? vA - vB : vB - vA;
    });
    return list;
  }, [wardPoints, tableSort]);

  const toggleSort = (field) => {
    setTableSort((prev) => ({
      field,
      asc: prev.field === field ? !prev.asc : true
    }));
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 flex flex-col space-y-3.5">
      {/* Header & Controls (Sentence Case & Data Driven) */}
      <div className="border-b border-border-subtle pb-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-ink-primary font-serif">
              Mysuru Ward Map
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-primary-soft text-primary border border-primary/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span>{sourcedBoundariesCount === totalWards ? 'All boundaries sourced' : `${sourcedBoundariesCount} of ${totalWards} boundaries sourced`}</span>
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {totalWards} municipal wards • Boundaries from Karnataka GIS (KGIS) / MCC Delimitation (ODbL-1.0)
          </p>
        </div>

        {/* View Switcher, Metric Toggle, and Notices */}
        <div className="flex items-center gap-2 flex-wrap">
          {unmappedWards.length > 0 && (
            <span className="text-[11px] text-status-medium bg-status-medium-soft px-2 py-0.5 rounded border border-status-medium/30 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3 h-3" />
              <span>{unmappedWards.length} wards without geometry</span>
            </span>
          )}

          {/* Metric Selector for Choropleth */}
          {viewMode === 'map' && (
            <div className="flex items-center gap-1 bg-sunken p-0.5 rounded border border-border-subtle text-xs">
              <button
                type="button"
                onClick={() => setMetric('total')}
                className={`px-2 py-1 rounded transition-colors ${
                  metric === 'total'
                    ? 'bg-surface text-ink-primary font-semibold shadow-xs'
                    : 'text-text-secondary hover:text-ink-primary'
                }`}
              >
                Total
              </button>
              <button
                type="button"
                onClick={() => setMetric('open')}
                className={`px-2 py-1 rounded transition-colors ${
                  metric === 'open'
                    ? 'bg-surface text-ink-primary font-semibold shadow-xs'
                    : 'text-text-secondary hover:text-ink-primary'
                }`}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => setMetric('in_progress')}
                className={`px-2 py-1 rounded transition-colors ${
                  metric === 'in_progress'
                    ? 'bg-surface text-ink-primary font-semibold shadow-xs'
                    : 'text-text-secondary hover:text-ink-primary'
                }`}
              >
                In Progress
              </button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-sunken p-0.5 rounded border border-border-subtle text-xs font-medium">
            <button
              type="button"
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
              type="button"
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
              {/* Civic grid background */}
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
                {/* 1. Official MCC Ward Polygons (Real Boundaries) */}
                {wardBoundariesGeoJson.features.map((feature) => {
                  const d = pathGenerator(feature);
                  if (!d) return null;
                  const data = getFeatureData(feature);
                  const isSelected = selectedWard?.ward_no === data.ward_no;
                  const isHovered = hoveredWard?.ward_no === data.ward_no;
                  const metricVal = getMetricValue(data);
                  const fillColor = getChoroplethColor(metricVal, maxMetricValue);

                  return (
                    <path
                      key={feature.id || `ward-${data.ward_no}`}
                      d={d}
                      data-ward-no={data.ward_no}
                      data-ward-id={feature.id}
                      fill={fillColor}
                      fillOpacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.70}
                      stroke={isSelected ? 'var(--color-primary)' : isHovered ? 'var(--ink-primary)' : 'var(--border-strong)'}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.6}
                      className="ward-polygon transition-colors duration-150 cursor-pointer outline-hidden"
                      tabIndex={0}
                      role="button"
                      aria-label={`Ward ${data.ward_no} ${data.ward_name}, ${data.count} reports, ${data.open_count} open, ${data.in_progress_count || 0} in progress`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWard(data);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedWard(data);
                        }
                      }}
                      onMouseEnter={() => setHoveredWard(data)}
                      onMouseLeave={() => setHoveredWard(null)}
                    />
                  );
                })}

                {/* 2. Ward Centroid Numbers and Incident Proportional Dots */}
                {wardBoundariesGeoJson.features.map((feature) => {
                  const data = getFeatureData(feature);
                  const centroid = feature.properties?.centroid;
                  if (!centroid) return null;
                  const [cx, cy] = projection(centroid);
                  if (isNaN(cx) || isNaN(cy)) return null;

                  const metricVal = getMetricValue(data);
                  const hasIncidents = metricVal > 0;
                  const dotRadius = hasIncidents
                    ? Math.min(14, Math.max(5, 5 + (metricVal / maxMetricValue) * 9))
                    : 0;
                  const isSelected = selectedWard?.ward_no === data.ward_no;
                  const isHovered = hoveredWard?.ward_no === data.ward_no;

                  return (
                    <g 
                      key={`centroid-${data.ward_no}`}
                      transform={`translate(${cx}, ${cy})`}
                      className="pointer-events-none"
                    >
                      {/* Proportional Dominant Category Incident Dot */}
                      {hasIncidents && (
                        <circle
                          r={dotRadius}
                          fill={data.top_category_color || 'var(--color-primary)'}
                          fillOpacity={0.88}
                          stroke="#FFFFFF"
                          strokeWidth={isSelected || isHovered ? 2 : 1}
                        />
                      )}

                      {/* Ward Number Indicator */}
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={dotRadius > 8 ? '8.5' : '7.5'}
                        fontFamily="var(--font-mono)"
                        fontWeight="bold"
                        fill={hasIncidents && dotRadius > 8 ? '#FFFFFF' : 'var(--ink-primary)'}
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
                        x={lx + 4}
                        y={ly + 3}
                        fontSize="8"
                        fontFamily="var(--font-sans)"
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

            {/* Pointer-Following Hover Tooltip (Never covers cursor or dots) */}
            {hoveredWard && !selectedWard && (
              <div 
                style={{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }}
                className="absolute pointer-events-none bg-surface/95 border border-border-strong rounded-md shadow-md p-2.5 text-xs z-20 space-y-1 max-w-[200px]"
              >
                <div className="font-serif font-bold text-ink-primary flex items-center gap-1.5">
                  <span className="font-mono text-[10px] bg-sunken px-1 rounded font-bold">#{hoveredWard.ward_no}</span>
                  <span className="truncate">{hoveredWard.ward_name}</span>
                </div>
                <div className="text-[11px] font-mono text-text-secondary">
                  <span>{hoveredWard.zone}</span> • <strong>{hoveredWard.count}</strong> reports
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
                  <span className="text-status-open">{hoveredWard.open_count} open</span>
                  <span>•</span>
                  <span className="text-status-resolved">{hoveredWard.resolved_count} res</span>
                </div>
                {hoveredWard.count > 0 && hoveredWard.top_category !== 'None' && (
                  <div className="text-[10px] text-text-muted truncate">
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
                      <span className="font-mono text-[10px] bg-primary-soft text-primary px-1.5 py-0.5 rounded font-bold">
                        #{selectedWard.ward_no}
                      </span>
                      <span>{selectedWard.ward_name}</span>
                    </div>
                    <p className="text-[10px] text-text-muted font-mono mt-0.5">
                      {selectedWard.zone} • {selectedWard.count} Total Complaints
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedWard(null)}
                    className="p-1 rounded text-text-muted hover:text-ink-primary hover:bg-sunken"
                    title="Close ward details"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-border-subtle font-mono text-[11px] text-center">
                  <div className="p-1.5 bg-status-open-soft rounded">
                    <span className="block text-[9px] text-status-open">OPEN</span>
                    <strong className="text-status-open">{selectedWard.open_count}</strong>
                  </div>
                  <div className="p-1.5 bg-status-progress-soft rounded">
                    <span className="block text-[9px] text-status-progress">PROG</span>
                    <strong className="text-status-progress">{selectedWard.in_progress_count || 0}</strong>
                  </div>
                  <div className="p-1.5 bg-status-resolved-soft rounded">
                    <span className="block text-[9px] text-status-resolved">RESOLVED</span>
                    <strong className="text-status-resolved">{selectedWard.resolved_count}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-text-secondary border-t border-border-subtle pt-1.5">
                  <span className="text-text-muted">Prevailing Hazard:</span>{' '}
                  <strong className="text-ink-primary">{selectedWard.top_category}</strong>
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
                  type="button"
                  onClick={() => setSelectedWard(null)}
                  className="p-1 rounded text-text-muted hover:text-ink-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                <div className="p-1.5 bg-status-open-soft rounded">
                  <span className="block text-[9px] text-status-open">OPEN</span>
                  <strong className="text-status-open">{selectedWard.open_count}</strong>
                </div>
                <div className="p-1.5 bg-status-progress-soft rounded">
                  <span className="block text-[9px] text-status-progress">PROG</span>
                  <strong className="text-status-progress">{selectedWard.in_progress_count || 0}</strong>
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

          {/* Dynamic Visual Legend Bar */}
          <div className="flex items-center justify-between text-xs text-text-muted pt-1 flex-wrap gap-2.5">
            {/* Choropleth Class Breaks (Data-Driven) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] font-semibold text-text-secondary">
                {metric === 'open' ? 'Open Issues:' : metric === 'in_progress' ? 'In Progress:' : 'Total Volume:'}
              </span>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className="w-3.5 h-3.5 rounded-sm border border-border-subtle inline-block" style={{ backgroundColor: '#F3EFE6' }} title="0 reports" />
                <span className="text-text-muted">0</span>
                <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ backgroundColor: '#D9E8DD' }} title={`1 to ${legendIntervals.b1}`} />
                <span className="text-text-muted">1–{legendIntervals.b1}</span>
                <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ backgroundColor: '#ADCDB8' }} title={`${legendIntervals.b1 + 1} to ${legendIntervals.b2}`} />
                <span className="text-text-muted">{legendIntervals.b1 + 1}–{legendIntervals.b2}</span>
                <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ backgroundColor: '#5F9575' }} title={`${legendIntervals.b2 + 1} to ${legendIntervals.b3}`} />
                <span className="text-text-muted">{legendIntervals.b2 + 1}–{legendIntervals.b3}</span>
                <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ backgroundColor: '#2F5D46' }} title={`${legendIntervals.b3 + 1}+`} />
                <span className="text-text-muted">{legendIntervals.b3 + 1}+</span>
              </div>
            </div>

            {/* Landmarks & Centroid Explanation */}
            <div className="flex items-center gap-3 font-mono text-[11px]">
              {verifiedLandmarksCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: 'var(--color-accent)' }} />
                  <span>Landmarks ({verifiedLandmarksCount})</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: 'var(--color-primary)' }} />
                <span>Incident Centroids</span>
              </div>
            </div>
          </div>

          {/* Source Attribution Footer */}
          <div className="text-[10px] text-text-muted/80 border-t border-border-subtle pt-2 flex items-center justify-between flex-wrap gap-2">
            <span>
              Source: Karnataka Geographic Information System (KGIS) / MCC Delimitation via OpenCity & Bharatlas • Licence: ODbL-1.0
            </span>
            <span className="font-mono">
              65 Official Wards • EPSG:4326
            </span>
          </div>
        </div>
      ) : (
        /* Accessible Sortable Tabular Roster */
        <div className="space-y-2">
          <div className="overflow-x-auto border border-border-subtle rounded-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-sunken/40 text-text-muted font-mono text-[10px] uppercase">
                  <th 
                    className="py-2.5 px-3 cursor-pointer hover:text-ink-primary select-none"
                    onClick={() => toggleSort('ward_no')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Ward #</span>
                      {tableSort.field === 'ward_no' && (tableSort.asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th 
                    className="py-2.5 px-3 cursor-pointer hover:text-ink-primary select-none"
                    onClick={() => toggleSort('ward_name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Ward Name</span>
                      {tableSort.field === 'ward_name' && (tableSort.asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th 
                    className="py-2.5 px-3 cursor-pointer hover:text-ink-primary select-none"
                    onClick={() => toggleSort('zone')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Zone</span>
                      {tableSort.field === 'zone' && (tableSort.asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th 
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-ink-primary select-none"
                    onClick={() => toggleSort('count')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Total</span>
                      {tableSort.field === 'count' && (tableSort.asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th 
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-ink-primary select-none"
                    onClick={() => toggleSort('open_count')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Open</span>
                      {tableSort.field === 'open_count' && (tableSort.asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th 
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-ink-primary select-none"
                    onClick={() => toggleSort('in_progress_count')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Prog</span>
                      {tableSort.field === 'in_progress_count' && (tableSort.asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th 
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-ink-primary select-none"
                    onClick={() => toggleSort('resolved_count')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Resolved</span>
                      {tableSort.field === 'resolved_count' && (tableSort.asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Prevailing Hazard</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {sortedRoster.map((p) => (
                  <tr key={p.ward_no || p.ward_name} className="hover:bg-sunken/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-ink-primary">
                      #{p.ward_no || '–'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-ink-primary">
                      {p.ward_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-text-secondary">
                      {p.zone}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-ink-primary">
                      {p.count}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-status-open font-semibold">
                      {p.open_count}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-status-progress font-semibold">
                      {p.in_progress_count || 0}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-status-resolved font-semibold">
                      {p.resolved_count}
                    </td>
                    <td className="py-2.5 px-3 font-serif text-ink-primary">
                      {p.top_category && p.top_category !== 'None' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: p.top_category_color }}
                          />
                          <span className="truncate max-w-[180px]">{p.top_category}</span>
                        </span>
                      ) : (
                        <span className="text-text-muted">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {onSelectWard && p.count > 0 && (
                        <button
                          type="button"
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
          <p className="text-[10px] text-text-muted">
            Showing all {sortedRoster.length} municipal wards with live incident counts and prevailing hazards. Click column headers to sort.
          </p>
        </div>
      )}
    </div>
  );
};
