/**
 * Galaxy Map Types and Configuration
 *
 * Shared types, visual configuration, and constants for the Galaxy Map components.
 *
 * @see GalaxyMapPanel.tsx for the main container component
 */

import { Sun, Circle, Sparkles, Skull, Zap } from 'lucide-react';
import type { StarSystemType } from '../../game/systems/StarSystemsSystem';

/**
 * Visual configuration for a star system type
 */
export interface SystemVisualConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

/**
 * Visual configuration for each star system type
 */
export const SYSTEM_VISUALS: Record<StarSystemType, SystemVisualConfig> = {
  home: {
    icon: Sun,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Your home system. Familiar territory.',
  },
  binary: {
    icon: Circle, // Two suns - simplified to one icon
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Twin suns create day/night cycles.',
  },
  nebula: {
    icon: Sparkles,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Dense cosmic clouds enhance refinement.',
  },
  blackhole: {
    icon: Skull,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    description: 'Extreme gravity boosts production.',
  },
  dyson: {
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    description: 'Ultimate power. Infinite potential.',
  },
};

/**
 * Format milliseconds to a human-readable time string
 */
export function formatTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

/**
 * Format milliseconds to MM:SS format
 */
export function formatTimeMMSS(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
