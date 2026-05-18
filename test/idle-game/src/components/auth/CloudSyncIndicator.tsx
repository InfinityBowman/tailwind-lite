/**
 * CloudSyncIndicator - Shows cloud save sync status in header
 *
 * Displays:
 * - Sync status icon (synced, syncing, error, offline)
 * - Last synced time on hover
 * - Manual sync button
 * - Screen reader announcements for status changes
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Cloud, CloudOff, AlertCircle, Check, Loader2, RefreshCw, X } from 'lucide-react';
import { useCloudSync, type SyncStatus } from '@/hooks/useCloudSync';
import { cn } from '@/lib/utils';

/**
 * Format relative time (e.g., "2 min ago", "just now")
 */
function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString();
}

interface StatusConfig {
  icon: React.ReactNode;
  label: string;
  color: string;
  animate?: boolean;
  announcement: string;
}

const STATUS_CONFIG: Record<SyncStatus, StatusConfig> = {
  idle: {
    icon: <Cloud className="w-4 h-4" />,
    label: 'Cloud Save',
    color: 'text-muted-foreground',
    announcement: '',
  },
  synced: {
    icon: <Check className="w-4 h-4" />,
    label: 'Synced',
    color: 'text-green-500',
    announcement: 'Synced to cloud',
  },
  syncing: {
    icon: <Loader2 className="w-4 h-4" />,
    label: 'Syncing...',
    color: 'text-blue-400',
    animate: true,
    announcement: 'Syncing to cloud',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Sync Error',
    color: 'text-red-500',
    announcement: 'Sync error occurred',
  },
  offline: {
    icon: <CloudOff className="w-4 h-4" />,
    label: 'Offline',
    color: 'text-yellow-500',
    announcement: 'Offline - cannot sync',
  },
  retrying: {
    icon: <RefreshCw className="w-4 h-4" />,
    label: 'Retrying',
    color: 'text-yellow-400',
    animate: true,
    announcement: 'Sync failed, retrying',
  },
};

function formatRetryTime(ms: number): string {
  if (ms < 1000) return 'now';
  return `${Math.ceil(ms / 1000)}s`;
}

export const CloudSyncIndicator: React.FC = () => {
  const {
    status,
    lastSyncedAt,
    error,
    isEnabled,
    syncNow,
    pendingChanges,
    retryAttempt,
    retryInMs,
    cancelRetry,
  } = useCloudSync();

  // Don't render if cloud sync isn't enabled
  if (!isEnabled) {
    return null;
  }

  const config = STATUS_CONFIG[status];
  const canSync = status !== 'syncing' && status !== 'offline' && status !== 'retrying';
  const isRetrying = status === 'retrying' && retryInMs !== null;

  return (
    <>
      {/* Screen reader announcements for status changes */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {config.announcement}
        {status === 'error' && error && `: ${error}`}
        {isRetrying && ` in ${formatRetryTime(retryInMs)}`}
      </span>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 h-8 px-2',
                config.color,
                !canSync && 'cursor-not-allowed opacity-70'
              )}
              onClick={canSync ? syncNow : undefined}
              disabled={!canSync}
              aria-label={`Cloud sync status: ${config.label}${canSync ? '. Click to sync now' : ''}`}
            >
              <span className={cn(config.animate && 'animate-spin')} aria-hidden="true">
                {config.icon}
              </span>
              <span className="hidden sm:inline text-xs">
                {isRetrying ? `Retry in ${formatRetryTime(retryInMs)}` : config.label}
              </span>
              {pendingChanges > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">({pendingChanges})</span>
              )}
            </Button>
            {isRetrying && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-destructive/20"
                onClick={e => {
                  e.stopPropagation();
                  cancelRetry();
                }}
                aria-label="Cancel retry"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs">
          <div className="space-y-1">
            <p className={cn('font-medium', config.color)}>{config.label}</p>

            {isRetrying && (
              <p className="text-xs text-yellow-400">
                Attempt {retryAttempt}/5 - Retrying in {formatRetryTime(retryInMs)}
              </p>
            )}

            {lastSyncedAt && !isRetrying && (
              <p className="text-xs text-muted-foreground">
                Last synced: {formatRelativeTime(lastSyncedAt)}
              </p>
            )}

            {error && !isRetrying && <p className="text-xs text-red-400">{error}</p>}

            {pendingChanges > 0 && (
              <p className="text-xs text-yellow-400">
                {pendingChanges} change{pendingChanges > 1 ? 's' : ''} pending
              </p>
            )}

            {isRetrying && (
              <p className="text-xs text-muted-foreground italic">Click X to cancel retry</p>
            )}

            {canSync && <p className="text-xs text-muted-foreground italic">Click to sync now</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </>
  );
};

export default CloudSyncIndicator;
