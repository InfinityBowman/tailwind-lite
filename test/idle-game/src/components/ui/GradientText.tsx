/**
 * Gradient Text
 * Text with gradient coloring
 */

import React from 'react';
import { cn } from '@/lib/utils';

type GradientPreset = 'purple' | 'gold' | 'success' | 'fire' | 'ice' | 'rainbow';

interface GradientTextProps {
  children: React.ReactNode;
  gradient?: GradientPreset | string; // Preset or custom class
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
}

const presets: Record<GradientPreset, string> = {
  purple: 'from-purple-400 via-pink-500 to-purple-600',
  gold: 'from-yellow-400 via-amber-500 to-orange-500',
  success: 'from-green-400 via-emerald-500 to-teal-500',
  fire: 'from-red-500 via-orange-500 to-yellow-500',
  ice: 'from-blue-400 via-cyan-500 to-blue-600',
  rainbow: 'from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
};

const GradientText: React.FC<GradientTextProps> = ({
  children,
  gradient = 'purple',
  as: Component = 'span',
  className,
}) => {
  const gradientClass = presets[gradient as GradientPreset] || gradient;

  return (
    <Component
      className={cn('bg-gradient-to-r bg-clip-text text-transparent', gradientClass, className)}
    >
      {children}
    </Component>
  );
};

export default GradientText;
