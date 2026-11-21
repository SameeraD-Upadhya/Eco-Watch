import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';

export const EmptyMasterDataPrompt = ({ onNavigateToMaster }) => {
  return (
    <div className="p-8 rounded-md border border-dashed border-border-strong bg-surface text-center max-w-xl mx-auto my-8 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3">
        <Layers className="w-5 h-5 stroke-[1.75]" />
      </div>
      <h3 className="text-sm font-semibold font-serif text-ink-primary mb-1">
        Master Data Setup Required
      </h3>
      <p className="text-xs text-text-secondary leading-relaxed mb-5 max-w-md mx-auto">
        EcoWatch enforces zero hardcoded values. Before citizens can submit observation reports, at least one environmental category and one municipal ward must be registered in MongoDB.
      </p>

      <button
        onClick={onNavigateToMaster}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-colors"
      >
        <span>Configure Categories & Wards in Master Data</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
