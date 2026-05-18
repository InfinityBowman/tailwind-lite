/**
 * Dynamic Icon component - maps icon names to Lucide components
 *
 * This uses explicit imports to enable tree-shaking.
 * Only icons used in achievements and events are included.
 */

import React from 'react';
import {
  // Achievement icons
  Archive,
  ArrowUpCircle,
  Banknote,
  Beaker,
  BookOpen,
  Circle,
  Clover,
  Coins,
  Crown,
  Dice6,
  Dices,
  Dna,
  Droplet,
  Eclipse,
  Factory,
  Flame,
  FlaskConical,
  Flower2,
  Gem,
  GitMerge,
  Globe,
  GraduationCap,
  HandCoins,
  Leaf,
  Package,
  PackageCheck,
  Rocket,
  Salad,
  Scroll,
  Shield,
  Ship,
  Sparkle,
  Sparkles,
  Sprout,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Truck,
  UserPlus,
  Users,
  Wand2,
  Wheat,
  // Event icons
  AlertTriangle,
  Moon,
  Snowflake,
  Sun,
  Timer,
  Zap,
  // Fallback
  HelpCircle,
  Calendar,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Icon registry - explicit mapping for tree-shaking
const iconRegistry: Record<string, LucideIcon> = {
  Archive,
  ArrowUpCircle,
  Banknote,
  Beaker,
  BookOpen,
  Circle,
  Clover,
  Coins,
  Crown,
  Dice6,
  Dices,
  Dna,
  Droplet,
  Eclipse,
  Factory,
  Flame,
  FlaskConical,
  Flower2,
  Gem,
  GitMerge,
  Globe,
  GraduationCap,
  HandCoins,
  Leaf,
  Package,
  PackageCheck,
  Rocket,
  Salad,
  Scroll,
  Shield,
  Ship,
  Sparkle,
  Sparkles,
  Sprout,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Truck,
  UserPlus,
  Users,
  Wand2,
  Wheat,
  AlertTriangle,
  Moon,
  Snowflake,
  Sun,
  Timer,
  Zap,
  HelpCircle,
  Calendar,
};

interface DynamicIconProps {
  name: string;
  className?: string;
  fallback?: LucideIcon;
}

/**
 * Renders a Lucide icon by name.
 * Falls back to HelpCircle if the icon is not found.
 */
export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  className = 'w-5 h-5',
  fallback = HelpCircle,
}) => {
  const IconComponent = iconRegistry[name] || fallback;
  return <IconComponent className={className} />;
};

/**
 * Get an icon component by name (for use where you need the component directly)
 */
export const getIcon = (name: string, fallback: LucideIcon = HelpCircle): LucideIcon => {
  return iconRegistry[name] || fallback;
};
