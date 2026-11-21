import React from 'react';

/**
 * StatusSpine - The domain signature detail for EcoWatch.
 * A thin vertical rail whose color encodes current status and whose notches
 * visually mark each recorded authority response intervention.
 */
export const StatusSpine = ({ status, responseCount = 0, className = "" }) => {
  let railColor = 'bg-rose-500';
  let notchColor = 'bg-rose-300 dark:bg-rose-400 border-rose-600';

  if (status === 'In Progress') {
    railColor = 'bg-amber-500';
    notchColor = 'bg-amber-200 dark:bg-amber-400 border-amber-600';
  } else if (status === 'Resolved') {
    railColor = 'bg-emerald-500';
    notchColor = 'bg-emerald-200 dark:bg-emerald-400 border-emerald-600';
  }

  // Cap visible notches to max 6 for visual neatness
  const notches = Array.from({ length: Math.min(responseCount, 6) });

  return (
    <div 
      className={`relative w-1.5 self-stretch rounded-full flex flex-col justify-around items-center py-2 shrink-0 ${railColor} ${className}`}
      title={`Status: ${status} | Responses logged: ${responseCount}`}
    >
      {notches.map((_, i) => (
        <span 
          key={i} 
          className={`w-2.5 h-2.5 rounded-full border border-surface shadow-xs ${notchColor} transform transition-transform hover:scale-125`}
        />
      ))}
    </div>
  );
};
