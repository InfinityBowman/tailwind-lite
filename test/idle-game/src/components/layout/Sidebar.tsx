import React, { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Target,
  Trophy,
  FlaskConical,
  Star,
  Gem,
  ChevronLeft,
  ChevronRight,
  Globe,
  Dices,
  Layers,
  GraduationCap,
  Users,
  Rocket,
  Calendar,
  BarChart3,
  Crown,
  Zap,
  TrendingUp,
  FileText,
  BookOpen,
  Bot,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ProgressTrackerWidget from '@/components/ui/ProgressTrackerWidget';
import { useGame } from '@/contexts/GameEngineContext';
import { useFeatureUnlocks } from '@/hooks/useFeatureUnlocks';
import type { Section, FarmingSubSection } from '@/router';

interface SidebarProps {
  activeSection: Section;
  activeSubSection?: FarmingSubSection;
  collapsed: boolean;
  onToggleCollapse: () => void;
  // Badge counts
  claimableQuests: number;
  claimableAchievements: number;
  claimableContracts: number;
  availableResearch: boolean;
  canPrestige: boolean;
  prestigePoints: number;
  crystals: number;
  seedCount: number;
  managerCount: number;
  managerCrystals: number;
  canClaimDaily?: boolean;
  hasActiveEvent?: boolean;
}

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'farming', label: 'Farming', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'managers', label: 'Managers', icon: <Users className="w-5 h-5" /> },
  { id: 'expeditions', label: 'Expeditions', icon: <Rocket className="w-5 h-5" /> },
  { id: 'daily', label: 'Daily Login', icon: <Calendar className="w-5 h-5" /> },
  { id: 'events', label: 'Events', icon: <Zap className="w-5 h-5" /> },
  { id: 'contracts', label: 'Contracts', icon: <FileText className="w-5 h-5" /> },
  { id: 'quests', label: 'Quests', icon: <Target className="w-5 h-5" /> },
  { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-5 h-5" /> },
  { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'leaderboard', label: 'Leaderboard', icon: <Crown className="w-5 h-5" /> },
  { id: 'market', label: 'Market', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'research', label: 'Research', icon: <FlaskConical className="w-5 h-5" /> },
  { id: 'mastery', label: 'Mastery', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'seedex', label: 'Seedex', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'prestige', label: 'Prestige', icon: <Star className="w-5 h-5" /> },
  {
    id: 'transcendence',
    label: 'Transcendence',
    icon: <Star className="w-5 h-5 text-purple-400" />,
  },
  { id: 'galaxy', label: 'Galaxy Map', icon: <Globe className="w-5 h-5 text-blue-400" /> },
  { id: 'shop', label: 'Shop', icon: <Gem className="w-5 h-5" /> },
  { id: 'ai-coop', label: 'AI Co-op', icon: <Bot className="w-5 h-5 text-cyan-400" /> },
];

const FARMING_SUB_ITEMS: { id: FarmingSubSection; label: string; icon: React.ReactNode }[] = [
  { id: 'planets', label: 'Planets', icon: <Globe className="w-4 h-4" /> },
  { id: 'gacha', label: 'Gacha', icon: <Dices className="w-4 h-4" /> },
  { id: 'fusion', label: 'Fusion', icon: <Layers className="w-4 h-4" /> },
];

// Helper to get route path for a section
const getSectionPath = (section: Section): string => {
  if (section === 'farming') {
    return '/play/farming/planets';
  }
  return `/play/${section}`;
};

// Helper to get route path for farming sub-section
const getFarmingSubPath = (sub: FarmingSubSection): string => {
  return `/play/farming/${sub}`;
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  activeSubSection = 'planets',
  collapsed,
  onToggleCollapse,
  claimableQuests,
  claimableAchievements,
  claimableContracts,
  availableResearch,
  canPrestige,
  prestigePoints,
  crystals,
  seedCount,
  managerCount,
  managerCrystals,
  canClaimDaily = false,
  hasActiveEvent = false,
}) => {
  // Get game state for feature unlocks
  const { state } = useGame();
  const { isNavUnlocked, isFarmingUnlocked } = useFeatureUnlocks(state);

  // Filter nav items based on unlock state
  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter(item => isNavUnlocked(item.id)),
    [isNavUnlocked]
  );

  // Filter farming sub-items based on unlock state
  const visibleFarmingSubItems = useMemo(
    () => FARMING_SUB_ITEMS.filter(item => isFarmingUnlocked(item.id)),
    [isFarmingUnlocked]
  );

  const getBadge = (section: Section) => {
    switch (section) {
      case 'contracts':
        return claimableContracts > 0 ? (
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        ) : null;
      case 'quests':
        return claimableQuests > 0 ? (
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        ) : null;
      case 'achievements':
        return claimableAchievements > 0 ? (
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        ) : null;
      case 'research':
        return availableResearch ? (
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        ) : null;
      case 'prestige':
        if (canPrestige) {
          return <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />;
        }
        if (prestigePoints > 0 && !collapsed) {
          return (
            <Badge
              variant="secondary"
              className="text-xs h-5 px-1.5 bg-yellow-500/20 text-yellow-300"
            >
              {prestigePoints}
            </Badge>
          );
        }
        return null;
      case 'shop':
        if (crystals > 0 && !collapsed) {
          return (
            <Badge
              variant="secondary"
              className="text-xs h-5 px-1.5 bg-purple-500/20 text-purple-300"
            >
              {crystals}
            </Badge>
          );
        }
        return null;
      case 'managers':
        if (managerCrystals > 0 && !collapsed) {
          return (
            <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-pink-500/20 text-pink-300">
              {managerCrystals}
            </Badge>
          );
        }
        if (managerCount > 0 && !collapsed) {
          return (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {managerCount}
            </Badge>
          );
        }
        return null;
      case 'farming':
        if (seedCount > 0 && !collapsed) {
          return (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {seedCount}
            </Badge>
          );
        }
        return null;
      case 'daily':
        return canClaimDaily ? (
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        ) : null;
      case 'events':
        return hasActiveEvent ? (
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 bg-card border-r border-border z-40 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-56',
        hasActiveEvent ? 'top-10 h-[calc(100vh-2.5rem)]' : 'top-0 h-screen'
      )}
    >
      {/* Logo area */}
      <div className="h-14 flex items-center justify-center border-b border-border px-3">
        {collapsed ? (
          <Sparkles className="w-6 h-6 text-primary" />
        ) : (
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent truncate">
            Space Farm
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {visibleNavItems.map(item => (
            <li key={item.id}>
              <Link
                to={getSectionPath(item.id)}
                aria-current={
                  activeSection === item.id && !(item.id === 'farming' && activeSubSection)
                    ? 'page'
                    : undefined
                }
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                  // For farming: only highlight if no sub-section is active (parent acts as category header)
                  activeSection === item.id && !(item.id === 'farming' && activeSubSection)
                    ? 'bg-primary/20 text-primary'
                    : activeSection === item.id && item.id === 'farming' && activeSubSection
                      ? 'text-foreground' // Farming with active sub: show as expanded but not "active"
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {item.icon}
                {!collapsed && <span className="flex-1 text-left text-sm">{item.label}</span>}
                {getBadge(item.id)}
              </Link>

              {/* Farming sub-sections - filtered by unlock state */}
              {item.id === 'farming' && !collapsed && visibleFarmingSubItems.length > 0 && (
                <ul className="mt-1 ml-4 space-y-0.5 border-l border-border pl-3">
                  {visibleFarmingSubItems.map(sub => (
                    <li key={sub.id}>
                      <Link
                        to={getFarmingSubPath(sub.id)}
                        aria-current={
                          activeSection === 'farming' && activeSubSection === sub.id
                            ? 'page'
                            : undefined
                        }
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-150',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-card',
                          activeSection === 'farming' && activeSubSection === sub.id
                            ? 'bg-secondary text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        )}
                      >
                        {sub.icon}
                        <span>{sub.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Progress Tracker - show for early game players */}
      {!collapsed && state.prestige.prestigeLevel < 3 && (
        <div className="px-2 pb-2">
          <ProgressTrackerWidget className="text-xs" />
        </div>
      )}

      <Separator />

      {/* Collapse toggle */}
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
