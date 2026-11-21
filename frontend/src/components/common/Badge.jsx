import React from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  let styles = 'bg-status-open-soft text-status-open border-status-open/30';
  let Icon = AlertCircle;

  if (status === 'In Progress') {
    styles = 'bg-status-progress-soft text-status-progress border-status-progress/30';
    Icon = Clock;
  } else if (status === 'Resolved') {
    styles = 'bg-status-resolved-soft text-status-resolved border-status-resolved/30';
    Icon = CheckCircle2;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      <Icon className="w-3 h-3 stroke-[2]" />
      <span>{status}</span>
    </span>
  );
};

export const SeverityBadge = ({ severity }) => {
  let styles = 'bg-severity-low-soft text-severity-low border-severity-low/30';
  
  if (severity === 'Medium') {
    styles = 'bg-severity-medium-soft text-severity-medium border-severity-medium/30';
  } else if (severity === 'High') {
    styles = 'bg-severity-high-soft text-severity-high border-severity-high/30';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold border uppercase tracking-wider font-mono ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      <span>{severity}</span>
    </span>
  );
};

export const CategoryChip = ({ name, colorHex }) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-sunken/60 border border-border-subtle text-ink-primary">
      <span 
        className="w-2 h-2 rounded-full shrink-0 shadow-xs" 
        style={{ backgroundColor: colorHex || '#2F5D46' }}
      />
      <span className="truncate max-w-[140px]">{name}</span>
    </span>
  );
};
