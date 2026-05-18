/**
 * Shared Reward Display Components
 *
 * Used by ContractsPanel, QuestsPanel, and other reward-showing UIs.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Coins, Sparkles, Gem, FlaskConical, Gift } from 'lucide-react';

export type RewardType = 'credits' | 'crystals' | 'essence' | 'refinedEssence';

interface RewardIconProps {
  type: RewardType;
  className?: string;
}

export const RewardIcon: React.FC<RewardIconProps> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'credits':
      return <Coins className={`${className} text-yellow-400`} />;
    case 'essence':
      return <Sparkles className={`${className} text-blue-400`} />;
    case 'crystals':
      return <Gem className={`${className} text-purple-400`} />;
    case 'refinedEssence':
      return <FlaskConical className={`${className} text-purple-400`} />;
    default:
      return <Gift className={className} />;
  }
};

interface RewardBadgeProps {
  type: RewardType;
  amount: number;
  /** Use short labels like "Essence" instead of "Seed Essence" */
  shortLabels?: boolean;
}

const FULL_LABELS: Record<RewardType, string> = {
  credits: 'Credits',
  essence: 'Seed Essence',
  crystals: 'Crystals',
  refinedEssence: 'Refined Essence',
};

const SHORT_LABELS: Record<RewardType, string> = {
  credits: 'Credits',
  essence: 'Essence',
  crystals: 'Crystals',
  refinedEssence: 'Refined',
};

const COLOR_CLASSES: Record<RewardType, string> = {
  credits: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  essence: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  crystals: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  refinedEssence: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export const RewardBadge: React.FC<RewardBadgeProps> = ({ type, amount, shortLabels = false }) => {
  const labels = shortLabels ? SHORT_LABELS : FULL_LABELS;

  return (
    <Badge variant="outline" className={`gap-1.5 ${COLOR_CLASSES[type]} border`}>
      <RewardIcon type={type} className="w-3 h-3" />
      {amount.toLocaleString()} {labels[type]}
    </Badge>
  );
};
