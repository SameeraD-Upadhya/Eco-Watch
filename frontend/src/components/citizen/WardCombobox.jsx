import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Search, ChevronDown, Check, Compass, AlertCircle, X } from 'lucide-react';

export const WardCombobox = ({
  locations = [],
  value,
  onChange,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeWardId, setActiveWardId] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);

  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef({});

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, flipUp: false, maxHeight: 300 });

  const selectedWard = useMemo(() => {
    return locations.find((l) => l.id === value || l.ward_name === value || (l.ward_no && l.ward_no === value));
  }, [locations, value]);

  // Flattened list of matched wards and groups
  const { filteredWards, filteredGroups } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups = {};
    const flatList = [];

    locations.forEach((loc) => {
      const matchName = loc.ward_name.toLowerCase().includes(q);
      const matchNo = loc.ward_no ? String(loc.ward_no).includes(q) : false;
      const matchZone = loc.zone ? loc.zone.toLowerCase().includes(q) : false;
      
      let matchedLocality = null;
      if (loc.localities && loc.localities.length > 0) {
        for (const locName of loc.localities) {
          if (locName.toLowerCase().includes(q)) {
            matchedLocality = locName;
            break;
          }
        }
      }

      if (!q || matchName || matchNo || matchZone || matchedLocality) {
        const item = { ...loc, matchedLocality: q ? matchedLocality : null };
        flatList.push(item);

        const zoneKey = loc.zone || 'Other Wards';
        if (!groups[zoneKey]) groups[zoneKey] = [];
        groups[zoneKey].push(item);
      }
    });

    return { filteredWards: flatList, filteredGroups: groups };
  }, [locations, search]);

  // Position calculation and viewport clamping
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const flipUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    // Viewport clamping (support 320px screens)
    const padding = 12;
    const width = Math.min(Math.max(rect.width, 280), window.innerWidth - padding * 2);
    const left = Math.max(padding, Math.min(rect.left, window.innerWidth - width - padding));

    setCoords({
      top: flipUp ? Math.max(padding, rect.top - dropdownHeight - 4) : rect.bottom + 4,
      left,
      width,
      flipUp,
      maxHeight: Math.min(dropdownHeight, flipUp ? spaceAbove - 16 : spaceBelow - 16)
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      if (filteredWards.length > 0) {
        setActiveWardId(filteredWards[0].id || filteredWards[0].ward_no);
      }
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Outside click close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (activeWardId && itemRefs.current[activeWardId]) {
      itemRefs.current[activeWardId]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeWardId]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === 'Tab') {
      setIsOpen(false);
      return;
    }

    const currentIndex = filteredWards.findIndex(
      (w) => (w.id || w.ward_no) === activeWardId
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < filteredWards.length - 1 ? currentIndex + 1 : 0;
      if (filteredWards[nextIndex]) {
        setActiveWardId(filteredWards[nextIndex].id || filteredWards[nextIndex].ward_no);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredWards.length - 1;
      if (filteredWards[prevIndex]) {
        setActiveWardId(filteredWards[prevIndex].id || filteredWards[prevIndex].ward_no);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (filteredWards.length > 0) {
        setActiveWardId(filteredWards[0].id || filteredWards[0].ward_no);
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      if (filteredWards.length > 0) {
        const last = filteredWards[filteredWards.length - 1];
        setActiveWardId(last.id || last.ward_no);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentIndex >= 0 && filteredWards[currentIndex]) {
        const selected = filteredWards[currentIndex];
        onChange(selected.id || selected.ward_name);
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
  };

  // GPS Nearest centroid locator
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
          onChange(closestWard.id || closestWard.ward_name);
          setIsOpen(false);
        } else {
          setLocError('No ward coordinates found within range');
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
    <div className="relative">
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
      <button
        ref={triggerRef}
        id="ward-combobox-trigger"
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="ward-listbox"
        aria-activedescendant={activeWardId ? `ward-opt-${activeWardId}` : undefined}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full px-3 py-1.5 text-xs rounded-sm bg-sunken/40 border cursor-pointer flex items-center justify-between gap-2 transition-all text-left ${
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
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-primary-soft text-primary font-bold rounded">
                #{selectedWard.ward_no}
              </span>
            )}
            <span className="font-medium text-ink-primary truncate" title={selectedWard.ward_name}>
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
            Select ward from {locations.length} verified MCC wards...
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {locError && (
        <p className="text-[10px] text-status-open flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-2.5 h-2.5" />
          <span>{locError}</span>
        </p>
      )}

      {/* Portal Dropdown Menu */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            id="ward-listbox"
            role="listbox"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 'var(--z-portal, 40)'
            }}
            className="bg-surface border border-border-subtle rounded-md shadow-md overflow-hidden flex flex-col text-xs"
            onKeyDown={handleKeyDown}
          >
            {/* Search Box */}
            <div className="p-2 border-b border-border-subtle bg-sunken/40 relative shrink-0">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                id="ward-combobox-search"
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updatePosition();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search ward name, number, or locality..."
                className="w-full pl-7 pr-7 py-1 text-xs bg-surface border border-border-subtle rounded-sm text-ink-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-ink-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Grouped Options List */}
            <div className="overflow-y-auto flex-1 divide-y divide-border-subtle">
              {filteredWards.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted">
                  No ward matches "{search}"
                </div>
              ) : (
                Object.entries(filteredGroups).map(([zone, zoneWards]) => (
                  <div key={zone}>
                    <div className="px-3 py-1 bg-sunken/80 text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm border-b border-border-subtle/50">
                      {zone} ({zoneWards.length})
                    </div>
                    <div className="py-0.5">
                      {zoneWards.map((loc) => {
                        const locId = loc.id || loc.ward_no;
                        const isSelected = selectedWard && (selectedWard.id === loc.id || selectedWard.ward_no === loc.ward_no);
                        const isActive = activeWardId === locId;

                        return (
                          <div
                            key={locId}
                            id={`ward-opt-${locId}`}
                            ref={(el) => {
                              itemRefs.current[locId] = el;
                            }}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              onChange(loc.id || loc.ward_name);
                              setIsOpen(false);
                              triggerRef.current?.focus();
                            }}
                            onMouseEnter={() => setActiveWardId(locId)}
                            className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary-soft text-primary font-semibold'
                                : isActive
                                  ? 'bg-sunken text-ink-primary'
                                  : 'text-ink-primary hover:bg-sunken/60'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1.5">
                                {loc.ward_no && (
                                  <span className="text-[10px] font-mono font-bold text-text-muted">
                                    #{loc.ward_no}
                                  </span>
                                )}
                                <span className="truncate" title={loc.ward_name}>
                                  {loc.ward_name}
                                </span>
                              </div>

                              {/* Highlight matched locality */}
                              {loc.matchedLocality ? (
                                <p className="text-[10px] text-color-accent font-medium mt-0.5">
                                  Matches locality: {loc.matchedLocality}
                                </p>
                              ) : loc.localities && loc.localities.length > 0 ? (
                                <p className="text-[10px] text-text-muted truncate mt-0.5 font-sans" title={loc.localities.join(', ')}>
                                  {loc.localities.slice(0, 3).join(', ')}
                                  {loc.localities.length > 3 ? '...' : ''}
                                </p>
                              ) : null}
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
          </div>,
          document.body
        )}
    </div>
  );
};
