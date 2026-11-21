import React, { useState } from 'react';
import { Modal } from './Modal';
import { 
  Compass, 
  MapPin, 
  Send, 
  ClipboardList, 
  Database, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';

const STEPS = [
  {
    title: 'Welcome to EcoWatch Mysuru',
    subtitle: 'Academic Municipal Incident & Recurrence Simulation',
    icon: Compass,
    content: (
      <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
        <p>
          EcoWatch is a full-stack civic application designed to monitor recurring environmental hazards,
          intake citizen complaints, and coordinate statutory remediation across Mysuru City Corporation (MCC).
        </p>
        <p className="p-2.5 bg-sunken/60 rounded border border-border-subtle font-sans">
          <strong>Key Rule:</strong> 100% of wards, categories, authorities, and incident reports are dynamically
          sourced from MongoDB—never hardcoded in application code.
        </p>
      </div>
    )
  },
  {
    title: '1. Recurrence Analytics & Hotspots',
    subtitle: 'Live Analytics Tab',
    icon: Compass,
    content: (
      <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
        <p>
          The analytics engine groups incidents by ward and hazard category in real time to calculate recurrence patterns.
        </p>
        <ul className="list-disc pl-4 space-y-1 font-mono text-[11px] text-ink-primary">
          <li><strong>Chronic:</strong> &ge; 5 repeat incidents (e.g. Devaraja Mohalla waste dumping)</li>
          <li><strong>Recurring:</strong> &ge; 3 reports or median interval &le; 30 days</li>
          <li><strong>SLA Compliance:</strong> Statutory turnaround compliance tracked per authority</li>
        </ul>
      </div>
    )
  },
  {
    title: '2. 65-Ward Offline Choropleth Map',
    subtitle: 'Hotspot Visualization',
    icon: MapPin,
    content: (
      <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
        <p>
          The map projects all 65 official MCC wards using an offline SVG choropleth with zero external map tile dependencies.
        </p>
        <ul className="list-disc pl-4 space-y-1 text-[11px]">
          <li>Wards shade progressively from light sage to deep forest green based on complaint volume.</li>
          <li>Click any ward to inspect its dominant hazard or click <strong>Filter Tracker</strong> to drill down.</li>
          <li>Pan and zoom controls support accessible touch navigation (&ge; 44 &times; 44 px).</li>
        </ul>
      </div>
    )
  },
  {
    title: '3. Citizen Observation Portal',
    subtitle: 'Public Grievance Intake',
    icon: Send,
    content: (
      <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
        <p>
          Citizens register observations without login friction.
        </p>
        <ul className="list-disc pl-4 space-y-1 text-[11px]">
          <li><strong>Ward Combobox:</strong> Search by ward number (#1..#65), ward name, or recognized locality.</li>
          <li><strong>Duplicate Nudge:</strong> Automatically surfaces existing open complaints in the same ward with 1-click corroboration.</li>
          <li><strong>Severity Matrix:</strong> Low, Medium, and High emergency classifications with distinct SLA targets.</li>
        </ul>
      </div>
    )
  },
  {
    title: '4. Response Tracker & Audit Trail',
    subtitle: 'Field Remediation Workflow',
    icon: ClipboardList,
    content: (
      <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
        <p>
          Field supervisors track and update remediation using a strict finite-state machine:
        </p>
        <div className="p-2.5 bg-sunken/60 rounded border border-border-subtle font-mono text-[11px] text-center font-bold text-ink-primary">
          Open &rarr; In Progress &rarr; Resolved (or Reopened)
        </div>
        <p className="text-[11px] mt-1">
          Each action documents the responding officer, timestamp, and notes for a permanent municipal audit trail.
        </p>
      </div>
    )
  },
  {
    title: '5. Dynamic Schema & Demonstration Reset',
    subtitle: 'Master Data & Simulation Tools',
    icon: Database,
    content: (
      <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
        <p>
          Admins can register new municipal categories and wards on the fly or bulk-import CSV/JSON datasets.
        </p>
        <p className="p-2.5 bg-primary-soft/50 rounded border border-primary/20 text-ink-primary">
          Use the <strong>Reset Demo</strong> button in the top navigation bar at any time to restore the default 150-incident Mysuru demonstration state with dynamically refreshed timestamps!
        </p>
      </div>
    )
  }
];

export const GuidedWalkthrough = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ecowatch_tour_completed', 'true');
      }
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={current.title}
      subtitle={current.subtitle}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center justify-between text-[11px] font-mono text-text-muted border-b border-border-subtle pb-2">
          <span>STEP {step + 1} OF {STEPS.length}</span>
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <span 
                key={i} 
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-primary' : i < step ? 'bg-primary/40' : 'bg-sunken border border-border-subtle'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[140px] flex flex-col justify-center">
          {current.content}
        </div>

        {/* Navigation Buttons */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 0}
            className="px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-ink-primary disabled:opacity-30 disabled:hover:text-text-secondary flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span>{isLast ? 'Finish Tour' : 'Next Step'}</span>
            {isLast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </Modal>
  );
};
