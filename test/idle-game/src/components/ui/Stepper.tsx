/**
 * Stepper Component
 * Multi-step progress indicator
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn('flex', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className={cn('flex items-center', !isLast && 'flex-1')}>
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-colors',
                  isCompleted && 'bg-green-600 text-white',
                  isCurrent && 'bg-purple-600 text-white ring-4 ring-purple-600/30',
                  !isCompleted && !isCurrent && 'bg-slate-700 text-slate-400'
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={cn('text-sm font-medium', isCurrent ? 'text-white' : 'text-slate-400')}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-slate-500 mt-0.5">{step.description}</div>
                )}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4 mt-[-24px]',
                  isCompleted ? 'bg-green-600' : 'bg-slate-700'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
export type { Step };
