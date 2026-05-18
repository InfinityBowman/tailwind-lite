/**
 * Notification Badge
 * Shows a count badge for notifications
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  max?: number; // Shows "9+" if count > max
  dot?: boolean; // Just show a dot, no number
  color?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
  children?: React.ReactNode;
}

const colors = {
  default: 'bg-purple-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  dot = false,
  color = 'default',
  className,
  children,
}) => {
  if (count <= 0 && !dot) {
    return <>{children}</>;
  }

  const displayCount = count > max ? `${max}+` : count;

  return (
    <div className={cn('relative inline-flex', className)}>
      {children}

      {dot ? (
        <span
          className={cn(
            'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900',
            colors[color]
          )}
        />
      ) : (
        <span
          className={cn(
            'absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center',
            'text-xs font-bold text-white rounded-full ring-2 ring-slate-900',
            colors[color]
          )}
        >
          {displayCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;
