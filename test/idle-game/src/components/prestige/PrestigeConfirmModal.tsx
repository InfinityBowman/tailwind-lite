/**
 * Prestige Confirm Modal
 * Confirmation dialog before resetting progress
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
import { Star, Trophy, Check, X, Lightbulb, Shield } from 'lucide-react';

interface PrestigeConfirmModalProps {
  potentialPoints: number;
  newLevel: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const PrestigeConfirmModal: React.FC<PrestigeConfirmModalProps> = ({
  potentialPoints,
  newLevel,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
          <DialogTitle className="text-2xl text-yellow-400">Prestige?</DialogTitle>
          <DialogDescription>Reset your progress for permanent bonuses</DialogDescription>
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
                <Star className="w-4 h-4 shrink-0" />
                <span className="font-bold tabular-nums">{potentialPoints}</span> Prestige Points
              </li>
              <li className="flex items-center gap-2">
                <Trophy className="w-4 h-4 shrink-0" />
                Reach Prestige Level <span className="font-bold tabular-nums">{newLevel}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                Keep all purchased prestige bonuses
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
                Quest progress
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 shrink-0" />
                Achievements
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 shrink-0" />
                Daily bonus (if unlocked)
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
                All credits
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3 h-3 shrink-0" />
                All seeds and plants
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3 h-3 shrink-0" />
                All planet progress and upgrades
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3 h-3 shrink-0" />
                All research progress
              </li>
              <li className="flex items-center gap-2">
                <X className="w-3 h-3 shrink-0" />
                All refined essence
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Tip */}
        <Card className="bg-secondary/50 border-border/50">
          <CardContent className="p-3 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span> Prestige bonuses are
              permanent and will make your next run faster! Use points to purchase powerful
              upgrades.
            </p>
          </CardContent>
        </Card>

        <DialogFooter className="gap-2 sm:gap-2 mt-2">
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="prestige" className="flex-1 gap-2">
            <Star className="w-4 h-4" />
            Prestige!
            <Star className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrestigeConfirmModal;
