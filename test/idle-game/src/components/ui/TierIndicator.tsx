/**
 * Tier Indicator
 * Shows seed/plant tier with consistent styling
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { getTierStyles, getTierName } from '@/utils/assets';

interface TierIndicatorProps {
  tier: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

const TierIndicator: React.FC<TierIndicatorProps> = ({
  tier,
  showLabel = false,
  size = 'md',
  className,
}) => {
  const styles = getTierStyles(tier);
  const name = getTierName(tier);

  return (
    <span
      className={cn('inline-flex items-center font-bold rounded', sizes[size], className)}
      style={{
        backgroundColor: `${styles.color}20`,
        color: styles.color,
        borderColor: `${styles.color}40`,
      }}
    >
      T{tier}
      {showLabel && <span className="ml-1 font-normal">{name}</span>}
    </span>
  );
};

export default TierIndicator;
