/**
 * Resource Display
 * Shows a resource with icon and formatted value
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Coins, Gem, Sparkles, Leaf } from 'lucide-react';
import { formatNumber } from '../../game/utils/numberFormat';

type ResourceType = 'credits' | 'crystals' | 'essence' | 'seeds';

interface ResourceDisplayProps {
  resource: ResourceType;
  value: number;
  showChange?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const RESOURCE_CONFIG: Record<
  ResourceType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    label: string;
  }
> = {
  credits: { icon: Coins, color: 'text-yellow-400', label: 'Credits' },
  crystals: { icon: Gem, color: 'text-cyan-400', label: 'Crystals' },
  essence: { icon: Sparkles, color: 'text-purple-400', label: 'Essence' },
  seeds: { icon: Leaf, color: 'text-green-400', label: 'Seeds' },
};

const sizes = {
  sm: { icon: 'w-4 h-4', text: 'text-sm', gap: 'gap-1' },
  md: { icon: 'w-5 h-5', text: 'text-base', gap: 'gap-1.5' },
  lg: { icon: 'w-6 h-6', text: 'text-lg', gap: 'gap-2' },
};

const ResourceDisplay: React.FC<ResourceDisplayProps> = ({
  resource,
  value,
  showChange,
  size = 'md',
  className,
}) => {
  const config = RESOURCE_CONFIG[resource];
  const sizeConfig = sizes[size];
  const Icon = config.icon;

  return (
    <div
      className={cn('inline-flex items-center', sizeConfig.gap, className)}
      title={`${config.label}: ${value.toLocaleString()}`}
    >
      <Icon className={cn(sizeConfig.icon, config.color)} />
      <span className={cn(sizeConfig.text, 'font-medium text-white tabular-nums')}>
        {formatNumber(value)}
      </span>

      {showChange !== undefined && showChange !== 0 && (
        <span className={cn('text-xs', showChange > 0 ? 'text-green-400' : 'text-red-400')}>
          {showChange > 0 ? '+' : ''}
          {formatNumber(showChange)}
        </span>
      )}
    </div>
  );
};

export default ResourceDisplay;
