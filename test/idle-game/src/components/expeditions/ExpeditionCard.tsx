/**
 * Expedition Card Component
 * Displays an expedition slot - idle, in-progress, or completed
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { Clock, CheckCircle, XCircle, Rocket, Lock, Play } from 'lucide-react';
import { Button } from '../ui/button';
import type { ActiveExpedition } from '../../game/systems/ExpeditionSystem';
import { EXPEDITION_TYPES, formatExpeditionDuration } from '../../game/config/expeditions';

interface ExpeditionCardProps {
  expedition?: ActiveExpedition;
  slotIndex: number;
  isLocked?: boolean;
  unlockRequirement?: string;
  onStart?: () => void;
  onCollect?: () => void;
  onCancel?: () => void;
  now?: number;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Complete!';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    const remainingSecs = seconds % 60;
    return `${minutes}m ${remainingSecs}s`;
  }
  return `${seconds}s`;
}

const ExpeditionCard: React.FC<ExpeditionCardProps> = ({
  expedition,
  slotIndex,
  isLocked = false,
  unlockRequirement,
  onStart,
  onCollect,
  onCancel,
  now = Date.now(),
}) => {
  // Locked slot
  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/5 bg-slate-800/30 min-h-[180px]">
        <Lock className="w-8 h-8 text-slate-600 mb-2" />
        <span className="text-sm text-slate-500 text-center">{unlockRequirement || 'Locked'}</span>
      </div>
    );
  }

  // Idle slot - no active expedition
  if (!expedition) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-white/10 bg-slate-800/30 min-h-[180px] hover:border-white/20 transition-all">
        <Rocket className="w-8 h-8 text-slate-500 mb-3" />
        <span className="text-sm text-slate-400 mb-4">Slot {slotIndex + 1} - Available</span>
        <Button onClick={onStart} size="sm" variant="outline" className="gap-2">
          <Play className="w-4 h-4" />
          Start Expedition
        </Button>
      </div>
    );
  }

  // Active expedition
  const type = EXPEDITION_TYPES[expedition.typeId];
  const timeRemaining = expedition.endTime - now;
  const isComplete = timeRemaining <= 0;
  const progress = isComplete
    ? 100
    : Math.floor(
        ((now - expedition.startTime) / (expedition.endTime - expedition.startTime)) * 100
      );

  return (
    <div
      className={cn(
        'flex flex-col p-4 rounded-xl border transition-all min-h-[180px]',
        isComplete ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-slate-800/50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rocket className={cn('w-5 h-5', isComplete ? 'text-green-400' : 'text-blue-400')} />
          <span className="font-medium text-white">{type.name}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>{formatExpeditionDuration(type.durationMs)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-400">Progress</span>
            <span className={isComplete ? 'text-green-400' : 'text-white'}>
              {isComplete ? 'Complete!' : formatTimeRemaining(timeRemaining)}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                isComplete ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Managers on expedition */}
        <div className="text-xs text-slate-500">
          {expedition.managerIds.length} manager{expedition.managerIds.length !== 1 ? 's' : ''}{' '}
          deployed
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        {isComplete ? (
          <Button
            onClick={onCollect}
            size="sm"
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            Collect Rewards
          </Button>
        ) : (
          <Button
            onClick={onCancel}
            size="sm"
            variant="outline"
            className="flex-1 gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            <XCircle className="w-4 h-4" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExpeditionCard;
