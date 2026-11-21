import React from 'react';
import { AlertTriangle, CheckCircle2, MapPin, Tag } from 'lucide-react';
import { StatusSpine } from '../common/StatusSpine';

export const HotspotBanner = ({ hotspot }) => {
  const hasHotspot = Boolean(hotspot?.has_hotspot && hotspot.count >= 2);

  if (hasHotspot) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 shadow-xs flex items-center justify-between gap-4">
        {/* Domain Signature Spine Accent */}
        <div className="w-1.5 self-stretch rounded-full bg-amber-500 shrink-0" />

        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-4 h-4 stroke-[2]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 font-mono">
                MUNICIPAL HOTSPOT ALERT
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-pill bg-amber-200/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-bold">
                {hotspot.count} REPEAT INCIDENTS
              </span>
            </div>
            <p className="text-xs font-medium text-amber-950 dark:text-amber-100 mt-0.5">
              {hotspot.message}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300 shrink-0">
          <span className="flex items-center gap-1 bg-amber-100/70 dark:bg-amber-900/30 px-2.5 py-1 rounded-sm border border-amber-200 dark:border-amber-800/60">
            <MapPin className="w-3.5 h-3.5" />
            <span>{hotspot.location_name}</span>
          </span>
          <span className="flex items-center gap-1 bg-amber-100/70 dark:bg-amber-900/30 px-2.5 py-1 rounded-sm border border-amber-200 dark:border-amber-800/60">
            <Tag className="w-3.5 h-3.5" />
            <span>{hotspot.category_name}</span>
          </span>
        </div>
      </div>
    );
  }

  // Neutral state when count < 2 or no pattern
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-3.5 flex items-center justify-between gap-3 text-xs text-text-secondary">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="font-medium text-text-primary">
          {hotspot?.message || 'No recurring environmental pattern detected across monitored wards.'}
        </span>
      </div>
      <span className="text-[11px] font-mono text-text-muted hidden sm:inline-block">
        Threshold: ≥ 2 recurring ward reports
      </span>
    </div>
  );
};
