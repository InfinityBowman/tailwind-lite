/**
 * Rarity Badge
 * Consistent display of item rarity
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Star, Crown, Sparkles, Gem, Circle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface RarityConfig {
  label: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  border: string;
}

const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: {
    label: 'Common',
    icon: Circle,
    bg: 'bg-slate-600/20',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
  },
  uncommon: {
    label: 'Uncommon',
    icon: Star,
    bg: 'bg-green-600/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  rare: {
    label: 'Rare',
    icon: Gem,
    bg: 'bg-blue-600/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  epic: {
    label: 'Epic',
    icon: Sparkles,
    bg: 'bg-purple-600/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  legendary: {
    label: 'Legendary',
    icon: Crown,
    bg: 'bg-amber-600/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
};

interface RarityBadgeProps {
  rarity: Rarity;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: {
    wrapper: 'px-1.5 py-0.5 text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    wrapper: 'px-2 py-1 text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    wrapper: 'px-3 py-1.5 text-base',
    icon: 'w-5 h-5',
  },
};

const RarityBadge: React.FC<RarityBadgeProps> = ({
  rarity,
  showLabel = true,
  size = 'md',
  className,
}) => {
  const config = RARITY_CONFIG[rarity];
  const sizeConfig = sizes[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.bg,
        config.text,
        config.border,
        sizeConfig.wrapper,
        className
      )}
    >
      <Icon className={sizeConfig.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

export default RarityBadge;
export { RARITY_CONFIG };
