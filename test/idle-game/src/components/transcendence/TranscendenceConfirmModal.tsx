/**
 * Transcendence Confirm Modal
 * Confirmation dialog before resetting prestige progress
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown, Check, X, Lightbulb, Shield } from 'lucide-react';

interface TranscendenceConfirmModalProps {
  potentialPoints: number;
  newLevel: number;
  currentPrestigeLevel: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const TranscendenceConfirmModal: React.FC<TranscendenceConfirmModalProps> = ({
  potentialPoints,
  newLevel,
  currentPrestigeLevel,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <DialogTitle className="text-2xl text-purple-400">Transcend?</DialogTitle>
          <DialogDescription>
            Sacrifice prestige progress for powerful meta-bonuses
          </DialogDescription>
        </DialogHeader>

        {/* What you'll get */}
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="p-4">
            <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2 text-sm">
              <Check className="w-4 h-4" />
              You will gain:
            </h3>
            <ul className="space-y-2 text-green-300 text-sm">
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="font-bold tabular-nums">{potentialPoints}</span> Transcendence
                Points
              </li>
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 shrink-0" />
                Reach Transcendence Level <span className="font-bold tabular-nums">{newLevel}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                Access to powerful meta-bonuses
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                Bonus prestige points on future runs
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* What persists */}
        <Card className="border-blue-500/50 bg-blue-500/10">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" />
              Always kept:
            </h3>
            <ul className="space-y-1.5 text-blue-300 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 shrink-0" />
                Transcendence points and bonuses
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 shrink-0" />
                Crystals
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 shrink-0" />
                Achievements
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 shrink-0" />
                Managers (assignments reset)
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* What you'll lose */}
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2 text-sm">
              <X className="w-4 h-4" />
              You will lose:
            </h3>
            <ul className="space-y-1.5 text-red-300 text-sm">
              <li className="flex items-center gap-2">
                <X className="w-3 h-3 shrink-0" />
                Prestige Level {currentPrestigeLevel}
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3 h-3 shrink-0" />
                All prestige points and bonuses
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3 h-3 shrink-0" />
                Everything reset by prestige
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Tip */}
        <Card className="bg-secondary/50 border-border/50">
          <CardContent className="p-3 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span> Transcendence bonuses stack
              with prestige bonuses and persist forever. The Head Start bonus gives you free
              prestige levels on future runs!
            </p>
          </CardContent>
        </Card>

        <DialogFooter className="gap-2 sm:gap-2 mt-2">
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Sparkles className="w-4 h-4" />
            Transcend!
            <Sparkles className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TranscendenceConfirmModal;
