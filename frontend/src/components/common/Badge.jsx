import React from 'react';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  let styles = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50';
  let Icon = AlertCircle;

  if (status === 'In Progress') {
    styles = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
    Icon = Clock;
  } else if (status === 'Resolved') {
    styles = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
    Icon = CheckCircle2;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold border ${styles}`}>
      <Icon className="w-3.5 h-3.5 stroke-[2]" />
      <span>{status}</span>
    </span>
  );
};

export const SeverityBadge = ({ severity }) => {
  let styles = 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/50';
  
  if (severity === 'Medium') {
    styles = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
  } else if (severity === 'High') {
    styles = 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold border uppercase tracking-wider ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      <span>{severity}</span>
    </span>
  );
};

export const CategoryChip = ({ name, colorHex }) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-medium bg-app border border-border-subtle text-text-primary">
      <span 
        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
        style={{ backgroundColor: colorHex || '#10B981' }}
      />
      <span className="truncate max-w-[140px]">{name}</span>
    </span>
  );
};
