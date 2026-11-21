import React from 'react';
import { Database, PlusCircle, ArrowRight, Layers } from 'lucide-react';

export const EmptyMasterDataPrompt = ({ onNavigateToMaster }) => {
  return (
    <div className="p-8 rounded-lg border-2 border-dashed border-border-strong bg-surface text-center max-w-xl mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
        <Layers className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">
        Master Data Setup Required
      </h3>
      <p className="text-xs text-text-secondary leading-relaxed mb-6 max-w-md mx-auto">
        EcoWatch enforces zero hardcoded values. Before citizens can submit observation reports, at least one environmental category and one municipal ward must be registered in MongoDB.
      </p>

      <button
        onClick={onNavigateToMaster}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
      >
        <span>Configure Categories & Wards in Master Data</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
