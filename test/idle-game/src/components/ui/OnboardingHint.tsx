import React from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { X, Lightbulb } from 'lucide-react';

interface OnboardingHintProps {
  id: string;
  title: string;
  message: string;
  onDismiss: (id: string) => void;
  dismissed: boolean;
}

export const OnboardingHint: React.FC<OnboardingHintProps> = ({
  id,
  title,
  message,
  onDismiss,
  dismissed,
}) => {
  if (dismissed) return null;

  return (
    <Card className="border-yellow-500/50 bg-yellow-500/10 mb-4">
      <CardContent className="p-3 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-yellow-400">{title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
        </div>
        <Button
          onClick={() => onDismiss(id)}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          aria-label={`Dismiss hint: ${title}`}
        >
          <X className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

// Common hints for the game
export const GAME_HINTS = {
  firstPull: {
    id: 'firstPull',
    title: 'Welcome to Space Farming!',
    message: 'Start by pulling seeds from the Gacha. Click "Pull x1" to get your first seed!',
  },
  firstSeed: {
    id: 'firstSeed',
    title: 'Plant Your Seed',
    message: 'Great! Now plant your seed on a planet. Click a planet, then "Manage" to add seeds.',
  },
  firstProduction: {
    id: 'firstProduction',
    title: 'Earning Credits',
    message:
      'Plants produce crops automatically. Exports happen every few seconds, earning you credits.',
  },
  fusion: {
    id: 'fusion',
    title: 'Seed Fusion',
    message:
      'Have 2 of the same seed type and tier? Fuse them in the Fusion tab to get higher tier seeds!',
  },
  prestige: {
    id: 'prestige',
    title: 'Ready to Prestige?',
    message:
      'When progress slows, prestige to earn permanent bonuses and start fresh with more power!',
  },
  managers: {
    id: 'managers',
    title: 'Recruit Managers',
    message:
      'Managers boost planet production and can be sent on expeditions. Recruit them with Manager Crystals!',
  },
  expeditions: {
    id: 'expeditions',
    title: 'Launch Expeditions',
    message:
      'Send managers on expeditions to earn bonus rewards. Higher rarity managers have better success rates!',
  },
  dailyChallenges: {
    id: 'dailyChallenges',
    title: 'Daily Challenges',
    message:
      'Complete daily challenges to earn rewards. Build a streak for bonus multipliers and special shields!',
  },
  mastery: {
    id: 'mastery',
    title: 'Seed Mastery',
    message:
      'Harvest seeds repeatedly to gain mastery levels. Higher mastery means better production and value!',
  },
};

export default OnboardingHint;
