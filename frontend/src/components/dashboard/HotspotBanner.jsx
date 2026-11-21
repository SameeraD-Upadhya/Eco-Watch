import React from 'react';
import { AlertTriangle, CheckCircle2, MapPin, Tag } from 'lucide-react';

export const HotspotBanner = ({ hotspot }) => {
  const hasHotspot = Boolean(hotspot?.has_hotspot && hotspot.count >= 2);

  if (hasHotspot) {
    return (
      <div className="relative overflow-hidden rounded-md border border-status-progress/40 bg-status-progress-soft p-3.5 shadow-sm flex items-center justify-between gap-3">
        {/* Domain Signature Spine Accent */}
        <div className="w-[3px] self-stretch rounded-full bg-status-progress shrink-0" />

        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full bg-status-progress/15 text-status-progress flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-status-progress font-mono">
                Municipal Hotspot Alert
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-status-progress/20 text-status-progress font-bold">
                {hotspot.count} repeat incidents
              </span>
            </div>
            <p className="text-xs font-medium text-ink-primary mt-0.5">
              {hotspot.message}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-ink-secondary shrink-0">
          <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded-sm border border-border-subtle">
            <MapPin className="w-3 h-3 text-text-muted" />
            <span>{hotspot.location_name}</span>
          </span>
          <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded-sm border border-border-subtle">
            <Tag className="w-3 h-3 text-text-muted" />
            <span>{hotspot.category_name}</span>
          </span>
        </div>
      </div>
    );
  }

  // Neutral state when count < 2 or no pattern
  return (
    <div className="rounded-md border border-border-subtle bg-surface p-3 flex items-center justify-between gap-3 text-xs text-text-secondary shadow-sm">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-status-resolved shrink-0" />
        <span className="font-medium text-ink-primary">
          {hotspot?.message || 'No recurring environmental pattern detected across monitored wards.'}
        </span>
      </div>
      <span className="text-[10px] font-mono text-text-muted hidden sm:inline-block">
        Threshold: ≥ 2 recurring ward reports
      </span>
    </div>
  );
};
