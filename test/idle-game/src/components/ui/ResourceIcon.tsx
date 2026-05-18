/**
 * Resource Icon
 * Consistent icon display for game resources
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Coins, Gem, Sparkles, Leaf } from 'lucide-react';

type ResourceType = 'credits' | 'crystals' | 'essence' | 'seeds';

interface ResourceIconProps {
  resource: ResourceType;
  size?: 'sm' | 'md' | 'lg';
  withGlow?: boolean;
  className?: string;
}

const RESOURCE_CONFIG: Record<
  ResourceType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    glow: string;
  }
> = {
  credits: {
    icon: Coins,
    color: 'text-yellow-400',
    glow: 'shadow-yellow-400/50',
  },
  crystals: {
    icon: Gem,
    color: 'text-cyan-400',
    glow: 'shadow-cyan-400/50',
  },
  essence: {
    icon: Sparkles,
    color: 'text-purple-400',
    glow: 'shadow-purple-400/50',
  },
  seeds: {
    icon: Leaf,
    color: 'text-green-400',
    glow: 'shadow-green-400/50',
  },
};

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const ResourceIcon: React.FC<ResourceIconProps> = ({
  resource,
  size = 'md',
  withGlow = false,
  className,
}) => {
  const config = RESOURCE_CONFIG[resource];
  const Icon = config.icon;

  return (
    <Icon
      className={cn(
        sizes[size],
        config.color,
        withGlow && `drop-shadow-lg ${config.glow}`,
        className
      )}
    />
  );
};

export default ResourceIcon;
