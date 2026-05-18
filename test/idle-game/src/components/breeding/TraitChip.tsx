/**
 * TraitChip Component
 * Displays a single trait as a pill-shaped badge with icon and color
 */

import React from 'react';
import {
  Flame,
  Droplet,
  Sprout,
  Eclipse,
  TrendingUp,
  Gem,
  Shield,
  Clover,
  Scroll,
  Zap,
  Wheat,
  Star,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRAIT_DEFINITIONS, type TraitId } from '../../game/config/traits';

// Map trait IDs to their Lucide icons
const TRAIT_ICONS: Record<TraitId, LucideIcon> = {
  FIRE: Flame,
  WATER: Droplet,
  EARTH: Sprout,
  VOID: Eclipse,
  GROWTH: TrendingUp,
  VALUE: Gem,
  HARDY: Shield,
  LUCKY: Clover,
  ANCIENT: Scroll,
  SWIFT: Zap,
  ABUNDANT: Wheat,
  COSMIC: Star,
  ORIGIN: Sparkles,
};

interface TraitChipProps {
  traitId: TraitId;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  isNew?: boolean;
  className?: string;
}

const TraitChip: React.FC<TraitChipProps> = ({
  traitId,
  size = 'md',
  showLabel = true,
  isNew = false,
  className,
}) => {
  const trait = TRAIT_DEFINITIONS[traitId];
  if (!trait) return null;

  const Icon = TRAIT_ICONS[traitId];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all',
        sizeClasses[size],
        isNew && 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-background',
        className
      )}
      style={{
        backgroundColor: `${trait.color}20`,
        color: trait.color,
        borderColor: trait.color,
        border: `1px solid ${trait.color}40`,
      }}
      title={trait.description}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {showLabel && <span>{trait.name}</span>}
      {isNew && <span className="text-yellow-400 font-bold text-xs ml-0.5">NEW!</span>}
    </div>
  );
};

export default TraitChip;
