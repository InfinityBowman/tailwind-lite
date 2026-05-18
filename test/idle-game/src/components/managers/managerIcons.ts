/**
 * Manager Icons Mapping
 *
 * Explicit icon imports to avoid bundling all of lucide-react.
 * Only the icons actually used by managers are imported here.
 */

import {
  Wheat,
  Salad,
  HandCoins,
  Truck,
  BookOpen,
  Circle,
  Ship,
  Clover,
  Globe,
  Target,
  GraduationCap,
  TrendingUp,
  Dices,
  Eclipse,
  Crown,
  User,
  Sparkles,
  UserPlus,
  HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Map of icon names to Lucide components.
 * Only includes icons used by managers.
 */
export const MANAGER_ICONS: Record<string, LucideIcon> = {
  Wheat,
  Salad,
  HandCoins,
  Truck,
  BookOpen,
  Circle,
  Ship,
  Clover,
  Globe,
  Target,
  GraduationCap,
  TrendingUp,
  Dices,
  Eclipse,
  Crown,
};

/**
 * Get the icon component for a manager template.
 * Falls back to User icon if not found.
 */
export function getManagerIcon(iconName: string): LucideIcon {
  return MANAGER_ICONS[iconName] ?? User;
}

// Re-export commonly used utility icons for manager components
export { User, Sparkles, UserPlus, HelpCircle };
