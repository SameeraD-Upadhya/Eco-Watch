import React from 'react';
import { Lightbulb, Printer } from 'lucide-react';

export const DataInsightsPanel = ({ insights = [] }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-surface border border-border-subtle rounded-md shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-status-medium-soft text-status-medium flex items-center justify-center shrink-0">
            <Lightbulb className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
            Automated Municipal Insights
          </h3>
        </div>

        <ul className="space-y-1.5 text-xs text-ink-primary font-sans leading-relaxed pl-8 list-disc marker:text-primary">
          {insights.map((sentence, index) => (
            <li key={index}>
              {sentence}
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 self-end sm:self-center">
        <button
          onClick={() => window.print()}
          className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-sunken hover:bg-surface border border-border-subtle text-ink-primary shadow-2xs hover:shadow-xs transition-colors flex items-center gap-1.5"
          title="Print official municipal audit report"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Audit Report</span>
        </button>
      </div>
    </div>
  );
};
