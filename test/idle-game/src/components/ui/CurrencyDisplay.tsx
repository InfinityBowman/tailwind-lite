/**
 * Currency Display
 * Shows game currency with proper formatting and animation
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Coins, Gem, Sparkles } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

type CurrencyType = 'credits' | 'crystals' | 'essence';

interface CurrencyDisplayProps {
  type: CurrencyType;
  value: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  showLabel?: boolean;
  className?: string;
}

const CURRENCY_CONFIG: Record<
  CurrencyType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    label: string;
  }
> = {
  credits: { icon: Coins, color: 'text-yellow-400', label: 'Credits' },
  crystals: { icon: Gem, color: 'text-cyan-400', label: 'Crystals' },
  essence: { icon: Sparkles, color: 'text-purple-400', label: 'Essence' },
};

const sizes = {
  sm: { icon: 'w-4 h-4', text: 'text-sm', gap: 'gap-1' },
  md: { icon: 'w-5 h-5', text: 'text-base', gap: 'gap-1.5' },
  lg: { icon: 'w-6 h-6', text: 'text-lg', gap: 'gap-2' },
};

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  type,
  value,
  size = 'md',
  animate = true,
  showLabel = false,
  className,
}) => {
  const config = CURRENCY_CONFIG[type];
  const sizeConfig = sizes[size];
  const Icon = config.icon;

  return (
    <div
      className={cn('inline-flex items-center', sizeConfig.gap, className)}
      title={`${config.label}: ${value.toLocaleString()}`}
    >
      <Icon className={cn(sizeConfig.icon, config.color)} />
      {showLabel && <span className={cn(sizeConfig.text, 'text-slate-400')}>{config.label}:</span>}
      <span className={cn(sizeConfig.text, 'font-medium text-white')}>
        {animate ? <AnimatedNumber value={value} /> : value.toLocaleString()}
      </span>
    </div>
  );
};

export default CurrencyDisplay;

// Standalone icon component for use in headers, etc.
interface CurrencyIconProps {
  type: CurrencyType;
  size?: number;
  className?: string;
}

const sizeClasses: Record<number, string> = {
  14: 'w-3.5 h-3.5',
  16: 'w-4 h-4',
  18: 'w-[18px] h-[18px]',
  20: 'w-5 h-5',
  24: 'w-6 h-6',
};

export const CurrencyIcon: React.FC<CurrencyIconProps> = ({ type, size = 20, className }) => {
  const config = CURRENCY_CONFIG[type];
  const Icon = config.icon;
  const sizeClass = sizeClasses[size] || 'w-5 h-5';
  return <Icon className={cn(sizeClass, config.color, className)} />;
};
