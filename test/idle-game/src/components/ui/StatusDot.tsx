/**
 * Status Dot
 * Small colored indicator for status display
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Status = 'online' | 'offline' | 'busy' | 'away' | 'success' | 'error' | 'warning';

interface StatusDotProps {
  status: Status;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const statusColors: Record<Status, string> = {
  online: 'bg-green-500',
  offline: 'bg-slate-500',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
};

const sizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const StatusDot: React.FC<StatusDotProps> = ({
  status,
  pulse = false,
  size = 'md',
  label,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const shouldPulse = pulse && !prefersReducedMotion;

  const dot = (
    <span
      className={cn(
        'inline-block rounded-full',
        statusColors[status],
        sizes[size],
        shouldPulse && 'animate-pulse',
        className
      )}
      aria-hidden={!!label}
    />
  );

  if (label) {
    return (
      <span className="inline-flex items-center gap-2">
        {dot}
        <span className="text-sm text-slate-300">{label}</span>
      </span>
    );
  }

  return dot;
};

export default StatusDot;
