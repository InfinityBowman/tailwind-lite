/**
 * Pulse Component
 * Wraps content with a pulsing animation for attention
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PulseProps {
  active?: boolean;
  color?: 'purple' | 'green' | 'yellow' | 'red' | 'blue';
  children: React.ReactNode;
  className?: string;
}

const colors = {
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
};

const Pulse: React.FC<PulseProps> = ({ active = true, color = 'purple', children, className }) => {
  const prefersReducedMotion = useReducedMotion();

  if (!active || prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <span className={cn('relative inline-flex', className)}>
      {children}
      <span
        className={cn('absolute inset-0 rounded-full opacity-75 animate-ping', colors[color])}
        style={{ animationDuration: '1.5s' }}
      />
    </span>
  );
};

export default Pulse;
