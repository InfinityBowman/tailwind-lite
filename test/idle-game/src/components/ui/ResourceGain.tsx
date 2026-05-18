/**
 * Resource Gain Animation
 * Shows floating "+X" when resources are gained
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { formatNumber } from '../../game/utils/numberFormat';

interface ResourceGainProps {
  amount: number;
  type: 'credits' | 'crystals' | 'essence' | 'plants';
  onComplete?: () => void;
}

const typeColors = {
  credits: 'text-yellow-400',
  crystals: 'text-purple-400',
  essence: 'text-green-400',
  plants: 'text-emerald-400',
};

const ResourceGain: React.FC<ResourceGainProps> = ({ amount, type, onComplete }) => {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setVisible(false);
        onComplete?.();
      },
      prefersReducedMotion ? 500 : 1500
    );

    return () => clearTimeout(timer);
  }, [prefersReducedMotion, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'text-lg font-bold pointer-events-none px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm',
        typeColors[type],
        !prefersReducedMotion && 'animate-bounce'
      )}
      aria-live="polite"
    >
      +{formatNumber(amount)}
    </div>
  );
};

export default ResourceGain;
