/**
 * Relative Time Display
 * Shows time relative to now (e.g., "5 minutes ago")
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RelativeTimeProps {
  timestamp: number; // Unix timestamp in ms
  updateInterval?: number; // ms between updates
  className?: string;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  // For older times, show date
  return new Date(timestamp).toLocaleDateString();
}

const RelativeTime: React.FC<RelativeTimeProps> = ({
  timestamp,
  updateInterval = 60000, // Update every minute by default
  className,
}) => {
  const [display, setDisplay] = useState(() => formatRelativeTime(timestamp));

  useEffect(() => {
    setDisplay(formatRelativeTime(timestamp));

    const interval = setInterval(() => {
      setDisplay(formatRelativeTime(timestamp));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [timestamp, updateInterval]);

  return (
    <time
      dateTime={new Date(timestamp).toISOString()}
      className={cn('text-slate-400', className)}
      title={new Date(timestamp).toLocaleString()}
    >
      {display}
    </time>
  );
};

export default RelativeTime;
