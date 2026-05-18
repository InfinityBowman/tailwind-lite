/**
 * CloudSaveConflictDialog - Dialog for resolving cloud vs local save conflicts
 *
 * Shows when cloud has newer data than local storage.
 * User must choose which save to keep.
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../ui/alert-dialog';
import { Cloud, HardDrive, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GameState } from '../../game/state/GameState';

interface CloudSaveConflictDialogProps {
  open: boolean;
  localVersion: number;
  localTimestamp: number;
  cloudVersion: number;
  cloudTimestamp: number;
  cloudSaveData: GameState | null;
  localSaveData: GameState | null;
  isSyncing: boolean;
  onKeepLocal: () => void;
  onUseCloud: () => void;
  onDismiss: () => void;
}

/**
 * Format a timestamp to a human-readable date/time string
 */
function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a timestamp as relative time (e.g., "5 minutes ago")
 */
function formatRelativeTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;

  // Future timestamps
  if (diff < 0) return 'just now';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;

  // Fall back to absolute date for older saves
  return formatTimestamp(ts);
}

/**
 * Get a summary of game progress from save data
 */
function getSaveSummary(data: GameState | null): {
  credits: number;
  planets: number;
  prestige: number;
} {
  if (!data) {
    return { credits: 0, planets: 0, prestige: 0 };
  }
  return {
    credits: data.ship?.totalCurrency || 0,
    planets: data.planets?.filter(p => p.unlocked).length || 0,
    prestige: data.prestige?.prestigeLevel || 0,
  };
}

/**
 * Format credits with K/M/B suffix
 */
function formatCredits(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function CloudSaveConflictDialog({
  open,
  localVersion,
  localTimestamp,
  cloudVersion,
  cloudTimestamp,
  cloudSaveData,
  localSaveData,
  isSyncing,
  onKeepLocal,
  onUseCloud,
  onDismiss,
}: CloudSaveConflictDialogProps) {
  const cloudSummary = getSaveSummary(cloudSaveData);
  const localSummary = getSaveSummary(localSaveData);

  return (
    <AlertDialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onDismiss()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Save Conflict Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Your cloud save is newer than your local save. Which version would you like to keep?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Cloud Save Card */}
          <div
            className={cn('rounded-lg border p-3 space-y-2', 'border-blue-500/50 bg-blue-500/5')}
          >
            <div className="flex items-center gap-2 text-blue-400 font-medium">
              <Cloud className="h-4 w-4" />
              Cloud Save
            </div>
            <div className="text-xs text-muted-foreground">Version {cloudVersion}</div>
            <div className="text-xs text-muted-foreground" title={formatTimestamp(cloudTimestamp)}>
              {formatRelativeTime(cloudTimestamp)}
            </div>
            <div className="pt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credits</span>
                <span>{formatCredits(cloudSummary.credits)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Planets</span>
                <span>{cloudSummary.planets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prestige</span>
                <span>{cloudSummary.prestige}</span>
              </div>
            </div>
          </div>

          {/* Local Save Card */}
          <div
            className={cn('rounded-lg border p-3 space-y-2', 'border-slate-500/50 bg-slate-500/5')}
          >
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <HardDrive className="h-4 w-4" />
              Local Save
            </div>
            <div className="text-xs text-muted-foreground">Version {localVersion}</div>
            <div className="text-xs text-muted-foreground" title={formatTimestamp(localTimestamp)}>
              {formatRelativeTime(localTimestamp)}
            </div>
            <div className="pt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credits</span>
                <span>{formatCredits(localSummary.credits)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Planets</span>
                <span>{localSummary.planets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prestige</span>
                <span>{localSummary.prestige}</span>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onKeepLocal} disabled={isSyncing} className="flex-1 gap-2">
            <HardDrive className="h-4 w-4" />
            Keep Local
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onUseCloud}
            disabled={isSyncing}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Cloud className="h-4 w-4" />
            Use Cloud
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default CloudSaveConflictDialog;
