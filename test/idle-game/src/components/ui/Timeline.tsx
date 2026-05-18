/**
 * Timeline Component
 * Vertical timeline for events/history
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const variantColors = {
  default: 'bg-slate-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600',
};

const Timeline: React.FC<TimelineProps> = ({ events, className }) => {
  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

      {events.map((event, index) => {
        const Icon = event.icon;
        const variant = event.variant || 'default';
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className={cn('relative pl-10', !isLast && 'pb-6')}>
            {/* Dot */}
            <div
              className={cn(
                'absolute left-2 w-5 h-5 rounded-full flex items-center justify-center',
                variantColors[variant]
              )}
            >
              {Icon && <Icon className="w-3 h-3 text-white" />}
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white">{event.title}</h4>
                {event.timestamp && (
                  <span className="text-xs text-slate-500">{event.timestamp}</span>
                )}
              </div>
              {event.description && (
                <p className="text-sm text-slate-400 mt-1">{event.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
export type { TimelineEvent };
