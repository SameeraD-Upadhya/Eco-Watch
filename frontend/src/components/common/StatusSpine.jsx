import React from 'react';

/**
 * StatusSpine - The domain signature detail for EcoWatch.
 * A 3 px solid vertical rail whose color encodes current status and whose notches
 * visually mark each recorded authority response intervention.
 */
export const StatusSpine = ({ status, responseCount = 0, className = "" }) => {
  let railColor = 'bg-status-open';
  let notchColor = 'bg-surface border-status-open';

  if (status === 'In Progress') {
    railColor = 'bg-status-progress';
    notchColor = 'bg-surface border-status-progress';
  } else if (status === 'Resolved') {
    railColor = 'bg-status-resolved';
    notchColor = 'bg-surface border-status-resolved';
  }

  // Cap visible notches to max 6 for visual neatness
  const notches = Array.from({ length: Math.min(responseCount, 6) });

  return (
    <div 
      className={`relative w-[3px] self-stretch rounded-full flex flex-col justify-around items-center py-2 shrink-0 ${railColor} ${className}`}
      title={`Status: ${status} | Responses logged: ${responseCount}`}
    >
      {notches.map((_, i) => (
        <span 
          key={i} 
          className={`w-2 h-2 rounded-full border-2 shadow-xs ${notchColor} transform transition-transform hover:scale-125 -mx-[2.5px]`}
        />
      ))}
    </div>
  );
};
