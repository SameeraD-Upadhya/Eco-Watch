import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, ChevronDown, Check, Compass, AlertCircle } from 'lucide-react';

export const WardCombobox = ({
  locations = [],
  value,
  onChange,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);
  const containerRef = useRef(null);

  // Close combobox when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedWard = useMemo(() => {
    return locations.find((l) => l.id === value || l.ward_name === value);
  }, [locations, value]);

  // Group wards by zone and filter by search query
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups = {};

    locations.forEach((loc) => {
      const matchName = loc.ward_name.toLowerCase().includes(q);
      const matchNo = loc.ward_no ? String(loc.ward_no).includes(q) : false;
      const matchZone = loc.zone ? loc.zone.toLowerCase().includes(q) : false;
      const matchLocality = loc.localities?.some((locName) =>
        locName.toLowerCase().includes(q)
      );

      if (!q || matchName || matchNo || matchZone || matchLocality) {
        const zoneKey = loc.zone || 'Other Wards';
        if (!groups[zoneKey]) groups[zoneKey] = [];
        groups[zoneKey].push(loc);
      }
    });

    return groups;
  }, [locations, search]);

  // Use browser geolocation to find closest ward centroid
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        let closestWard = null;
        let minDistance = Infinity;

        locations.forEach((loc) => {
          if (loc.lat && loc.lng) {
            const dLat = userLat - loc.lat;
            const dLng = userLng - loc.lng;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            if (dist < minDistance) {
              minDistance = dist;
              closestWard = loc;
            }
          }
        });

        if (closestWard) {
          onChange(closestWard.id);
          setIsOpen(false);
        } else {
          setLocError('No ward coordinates found to match location');
        }
        setLocating(false);
      },
      (err) => {
        setLocError('Location permission denied or unavailable');
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-ink-primary mb-1 flex items-center justify-between font-mono">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-text-muted" />
          <span>Municipal Ward</span>
        </span>
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={locating}
          className="text-[10px] text-primary hover:text-primary-hover font-sans flex items-center gap-1 underline underline-offset-2 transition-colors disabled:opacity-50"
          title="Detect nearest ward via GPS centroid"
        >
          <Compass className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'Locating...' : 'Use my location'}</span>
        </button>
      </label>

      {/* Main Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-1.5 text-xs rounded-sm bg-sunken/40 border cursor-pointer flex items-center justify-between gap-2 transition-all ${
          error 
            ? 'border-status-open ring-1 ring-status-open/20' 
            : isOpen 
              ? 'border-primary ring-1 ring-primary/20 bg-surface' 
              : 'border-border-subtle hover:border-border-strong'
        }`}
      >
        {selectedWard ? (
          <div className="flex items-center gap-2 min-w-0">
            {selectedWard.ward_no && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-primary-soft text-primary font-bold rounded">
                #{selectedWard.ward_no}
              </span>
            )}
            <span className="font-medium text-ink-primary truncate">
              {selectedWard.ward_name}
            </span>
            {selectedWard.zone && (
              <span className="text-[10px] text-text-muted hidden sm:inline-block">
                ({selectedWard.zone})
              </span>
            )}
          </div>
        ) : (
          <span className="text-text-muted">
            Select ward from {locations.length} registered...
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {locError && (
        <p className="text-[10px] text-status-open flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-2.5 h-2.5" />
          <span>{locError}</span>
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface border border-border-subtle rounded-md shadow-md overflow-hidden">
          {/* Search Box */}
          <div className="p-2 border-b border-border-subtle bg-sunken/30 relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ward name, number, or locality..."
              className="w-full pl-7 pr-3 py-1 text-xs bg-surface border border-border-subtle rounded-sm text-ink-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Grouped Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-border-subtle">
            {Object.keys(filteredGroups).length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">
                No wards match "{search}"
              </div>
            ) : (
              Object.entries(filteredGroups).map(([zone, zoneWards]) => (
                <div key={zone}>
                  <div className="px-3 py-1 bg-sunken/60 text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider sticky top-0">
                    {zone} ({zoneWards.length})
                  </div>
                  <div className="py-0.5">
                    {zoneWards.map((loc) => {
                      const isSelected = loc.id === value || loc.ward_name === value;
                      return (
                        <div
                          key={loc.id}
                          onClick={() => {
                            onChange(loc.id);
                            setIsOpen(false);
                            setSearch('');
                          }}
                          className={`px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer hover:bg-sunken/70 transition-colors ${
                            isSelected ? 'bg-primary-soft text-primary font-medium' : 'text-ink-primary'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              {loc.ward_no && (
                                <span className="text-[10px] font-mono font-semibold text-text-muted">
                                  #{loc.ward_no}
                                </span>
                              )}
                              <span className="truncate">{loc.ward_name}</span>
                            </div>
                            {loc.localities?.length > 0 && (
                              <p className="text-[10px] text-text-muted truncate mt-0.5 font-sans">
                                {loc.localities.join(', ')}
                              </p>
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
