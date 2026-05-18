/**
 * SyncStatusIndicator - Shows cloud sync status in the UI
 *
 * Displays current sync state:
 * - Synced (green check) - last sync time
 * - Syncing (spinner) - in progress
 * - Offline (gray cloud) - no internet connection
 * - Error (red) - sync failed
 * - Retrying (yellow) - retry pending with countdown
 * - Disabled (hidden) - not logged in or Convex disabled
 */

import { Cloud, CloudOff, Check, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export interface SyncStatusIndicatorProps {
  /** Whether sync is enabled (user logged in) */
  isEnabled: boolean;
  /** Currently syncing */
  isSyncing: boolean;
  /** Whether online */
  isOnline: boolean;
  /** Last successful sync time (ms timestamp) */
  lastSyncTime: number | null;
  /** Error message if any */
  error: string | null;
  /** Current retry attempt (0 = no retry, 1+ = retrying) */
  retryAttempt?: number;
  /** Time until next retry (ms) */
  retryInMs?: number | null;
  /** Callback to cancel retry */
  onCancelRetry?: () => void;
  /** Custom class name */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show label text */
  showLabel?: boolean;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 5000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatRetryTime(ms: number): string {
  if (ms < 1000) return 'now';
  return `${Math.ceil(ms / 1000)}s`;
}

export function SyncStatusIndicator({
  isEnabled,
  isSyncing,
  isOnline,
  lastSyncTime,
  error,
  retryAttempt = 0,
  retryInMs = null,
  onCancelRetry,
  className,
  size = 'sm',
  showLabel = false,
}: SyncStatusIndicatorProps) {
  // Don't render if sync is not enabled
  if (!isEnabled) {
    return null;
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const iconSize = iconSizes[size];
  const isRetrying = retryAttempt > 0 && retryInMs !== null;

  // Determine status
  let status: 'synced' | 'syncing' | 'offline' | 'error' | 'retrying' = 'synced';
  let statusText = 'Synced';
  let tooltipText = 'Cloud save synced';

  if (!isOnline) {
    status = 'offline';
    statusText = 'Offline';
    tooltipText = 'No internet connection. Changes will sync when back online.';
  } else if (isRetrying) {
    status = 'retrying';
    statusText = `Retry in ${formatRetryTime(retryInMs)}`;
    tooltipText = `Sync failed. Retrying (attempt ${retryAttempt}/5) in ${formatRetryTime(retryInMs)}`;
  } else if (error && retryAttempt === 0) {
    // Only show error if not retrying
    status = 'error';
    statusText = 'Error';
    tooltipText = `Sync error: ${error}`;
  } else if (isSyncing) {
    status = 'syncing';
    statusText = 'Syncing';
    tooltipText = 'Syncing to cloud...';
  } else if (lastSyncTime) {
    tooltipText = `Last synced: ${formatRelativeTime(lastSyncTime)}`;
  } else {
    tooltipText = 'Waiting for first sync';
  }

  const statusIcons = {
    synced: <Check className={cn(iconSize, 'text-green-500')} />,
    syncing: <Loader2 className={cn(iconSize, 'text-blue-500 animate-spin')} />,
    offline: <CloudOff className={cn(iconSize, 'text-gray-400')} />,
    error: <AlertCircle className={cn(iconSize, 'text-red-500')} />,
    retrying: <RefreshCw className={cn(iconSize, 'text-yellow-500 animate-pulse')} />,
  };

  const statusColors = {
    synced: 'text-green-500',
    syncing: 'text-blue-500',
    offline: 'text-gray-400',
    error: 'text-red-500',
    retrying: 'text-yellow-500',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn('flex items-center gap-1.5 cursor-default', className)}
            role="status"
            aria-label={tooltipText}
          >
            <Cloud className={cn(iconSize, statusColors[status], 'opacity-70')} />
            {statusIcons[status]}
            {showLabel && <span className={cn('text-xs', statusColors[status])}>{statusText}</span>}
            {isRetrying && onCancelRetry && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
                onClick={e => {
                  e.stopPropagation();
                  onCancelRetry();
                }}
                aria-label="Cancel retry"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-xs">
          <p>{tooltipText}</p>
          {isRetrying && <p className="text-yellow-400 mt-1">Click X to cancel retry</p>}
          {lastSyncTime && status !== 'syncing' && status !== 'retrying' && (
            <p className="text-muted-foreground mt-1">
              Last sync: {formatRelativeTime(lastSyncTime)}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact sync indicator for header/footer
 * Shows only icon with tooltip
 */
export function CompactSyncIndicator({
  isEnabled,
  isSyncing,
  isOnline,
  lastSyncTime,
  error,
  retryAttempt,
  retryInMs,
  onCancelRetry,
  className,
}: Omit<SyncStatusIndicatorProps, 'size' | 'showLabel'>) {
  return (
    <SyncStatusIndicator
      isEnabled={isEnabled}
      isSyncing={isSyncing}
      isOnline={isOnline}
      lastSyncTime={lastSyncTime}
      error={error}
      retryAttempt={retryAttempt}
      retryInMs={retryInMs}
      onCancelRetry={onCancelRetry}
      className={className}
      size="sm"
      showLabel={false}
    />
  );
}

export default SyncStatusIndicator;
