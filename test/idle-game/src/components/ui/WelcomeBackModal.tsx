/**
 * Welcome Back Modal
 * Shows summary of offline progress when player returns
 * Uses shadcn Dialog component for consistent UI
 */

import React from 'react';
import { Clock, Coins, Leaf, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatNumber } from '../../game/utils/numberFormat';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface OfflineProgress {
  timeAway: string; // e.g., "2h 30m"
  creditsEarned: number;
  plantsHarvested: number;
  essenceGained: number;
}

interface WelcomeBackModalProps {
  progress: OfflineProgress;
  onDismiss: () => void;
  onDoubleRewards?: () => void; // Optional ad-watch callback
}

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  progress,
  onDismiss,
  onDoubleRewards,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Dialog open={true} onOpenChange={open => !open && onDismiss()}>
      <DialogContent
        className={cn(
          'sm:max-w-md bg-slate-900/95 border-purple-500/30',
          !prefersReducedMotion && 'animate-in fade-in zoom-in duration-300'
        )}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">
            <span className="text-purple-400">Welcome Back!</span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-center gap-2 text-slate-300 pt-2">
              <Clock className="w-4 h-4" />
              <span>You were away for {progress.timeAway}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Progress summary */}
        <div className="space-y-2 bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">While you were gone...</h3>

          {/* Credits earned */}
          {progress.creditsEarned > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-400">
                <Coins className="w-4 h-4" />
                <span>Credits earned</span>
              </div>
              <span className="text-white font-medium">
                +{formatNumber(progress.creditsEarned)}
              </span>
            </div>
          )}

          {/* Plants harvested */}
          {progress.plantsHarvested > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <Leaf className="w-4 h-4" />
                <span>Plants harvested</span>
              </div>
              <span className="text-white font-medium">
                +{formatNumber(progress.plantsHarvested)}
              </span>
            </div>
          )}

          {/* Essence gained */}
          {progress.essenceGained > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-4 h-4" />
                <span>Essence gained</span>
              </div>
              <span className="text-white font-medium">
                +{formatNumber(progress.essenceGained)}
              </span>
            </div>
          )}

          {/* Nothing happened */}
          {progress.creditsEarned === 0 &&
            progress.plantsHarvested === 0 &&
            progress.essenceGained === 0 && (
              <p className="text-slate-400 text-center py-2">Your farms are waiting for you!</p>
            )}
        </div>

        {/* Actions */}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {onDoubleRewards && (
            <Button
              onClick={onDoubleRewards}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Double Rewards (Watch Ad)
            </Button>
          )}

          <Button
            onClick={onDismiss}
            variant={onDoubleRewards ? 'outline' : 'default'}
            className="w-full"
          >
            {onDoubleRewards ? 'Collect & Continue' : "Let's Go!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeBackModal;
