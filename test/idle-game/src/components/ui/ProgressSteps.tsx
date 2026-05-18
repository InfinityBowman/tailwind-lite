/**
 * Progress Steps
 * Horizontal progress indicator with step markers
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressStepsProps {
  total: number;
  current: number; // 0-indexed
  labels?: string[];
  className?: string;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ total, current, labels, className }) => {
  // Guard against division by zero
  const progress = total > 0 ? Math.min(100, Math.max(0, ((current + 1) / total) * 100)) : 0;

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step markers */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: total }).map((_, i) => {
          const isComplete = i <= current;
          const isCurrent = i === current;

          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className={cn(
                  'w-3 h-3 rounded-full -mt-4 border-2',
                  isComplete ? 'bg-purple-500 border-purple-500' : 'bg-slate-800 border-slate-600',
                  isCurrent && 'ring-2 ring-purple-500/50'
                )}
              />
              {labels?.[i] && (
                <span className={cn('text-xs mt-2', isComplete ? 'text-white' : 'text-slate-500')}>
                  {labels[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSteps;
