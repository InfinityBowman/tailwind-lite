/**
 * Glow Component
 * Adds a glowing effect around content
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface GlowProps {
  color?: 'purple' | 'green' | 'yellow' | 'red' | 'blue' | 'cyan' | 'pink';
  intensity?: 'subtle' | 'medium' | 'strong';
  animate?: boolean;
  children: React.ReactNode;
  className?: string;
}

const glowColors = {
  purple: 'shadow-purple-500/50',
  green: 'shadow-green-500/50',
  yellow: 'shadow-yellow-500/50',
  red: 'shadow-red-500/50',
  blue: 'shadow-blue-500/50',
  cyan: 'shadow-cyan-500/50',
  pink: 'shadow-pink-500/50',
};

const intensities = {
  subtle: 'shadow-lg',
  medium: 'shadow-xl',
  strong: 'shadow-2xl',
};

const Glow: React.FC<GlowProps> = ({
  color = 'purple',
  intensity = 'medium',
  animate = false,
  children,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  return (
    <div
      className={cn(
        'relative',
        intensities[intensity],
        glowColors[color],
        shouldAnimate && 'animate-pulse',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Glow;
