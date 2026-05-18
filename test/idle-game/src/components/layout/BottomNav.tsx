/**
 * BottomNav - Mobile bottom tab navigation
 *
 * Shows on mobile screens (< lg breakpoint) to replace the sidebar.
 * Provides quick access to main game sections with a "More" menu for others.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  FlaskConical,
  Target,
  Gem,
  Menu,
  X,
  Users,
  Rocket,
  Calendar,
  Zap,
  Trophy,
  BarChart3,
  Crown,
  GraduationCap,
  Star,
  TrendingUp,
  FileText,
  ScrollText,
  Settings,
  BookOpen,
} from 'lucide-react';
import { useGame } from '@/contexts/GameEngineContext';
import { useFeatureUnlocks } from '@/hooks/useFeatureUnlocks';
import type { Section } from '@/router';

interface BottomNavProps {
  activeSection: Section;
  claimableQuests: number;
  claimableAchievements: number;
  claimableContracts: number;
  availableResearch: boolean;
  canPrestige: boolean;
  canClaimDaily?: boolean;
  hasActiveEvent?: boolean;
  onSettingsClick?: () => void;
}

// Primary tabs shown in the bottom bar
const PRIMARY_TABS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'farming', label: 'Farm', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'research', label: 'Research', icon: <FlaskConical className="w-5 h-5" /> },
  { id: 'quests', label: 'Quests', icon: <Target className="w-5 h-5" /> },
  { id: 'shop', label: 'Shop', icon: <Gem className="w-5 h-5" /> },
];

// All other sections for the "More" menu
const MORE_SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'managers', label: 'Managers', icon: <Users className="w-5 h-5" /> },
  { id: 'expeditions', label: 'Expeditions', icon: <Rocket className="w-5 h-5" /> },
  { id: 'daily', label: 'Daily Login', icon: <Calendar className="w-5 h-5" /> },
  { id: 'events', label: 'Events', icon: <Zap className="w-5 h-5" /> },
  { id: 'contracts', label: 'Contracts', icon: <FileText className="w-5 h-5" /> },
  { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-5 h-5" /> },
  { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'leaderboard', label: 'Leaderboard', icon: <Crown className="w-5 h-5" /> },
  { id: 'market', label: 'Market', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'mastery', label: 'Mastery', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'seedex', label: 'Seedex', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'prestige', label: 'Prestige', icon: <Star className="w-5 h-5" /> },
  {
    id: 'transcendence',
    label: 'Transcendence',
    icon: <Star className="w-5 h-5 text-purple-400" />,
  },
  { id: 'changelog', label: 'Changelog', icon: <ScrollText className="w-5 h-5" /> },
];

// Helper to get route path for a section
const getSectionPath = (section: Section): string => {
  if (section === 'farming') {
    return '/play/farming/planets';
  }
  return `/play/${section}`;
};

export const BottomNav: React.FC<BottomNavProps> = React.memo(
  ({
    activeSection,
    claimableQuests,
    claimableAchievements,
    claimableContracts,
    availableResearch,
    canPrestige,
    canClaimDaily = false,
    hasActiveEvent = false,
    onSettingsClick,
  }) => {
    const [showMore, setShowMore] = useState(false);
    const { state } = useGame();
    const { isNavUnlocked } = useFeatureUnlocks(state);
    const navigate = useNavigate();
    const moreButtonRef = useRef<HTMLButtonElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    // Filter tabs based on unlock state
    const visiblePrimaryTabs = PRIMARY_TABS.filter(tab => isNavUnlocked(tab.id));
    const visibleMoreSections = MORE_SECTIONS.filter(section => isNavUnlocked(section.id));

    // Check if "More" menu is active (current section is in the more menu)
    const isMoreActive = visibleMoreSections.some(s => s.id === activeSection);

    // Badge indicator for a section
    const hasBadge = useCallback(
      (section: Section): boolean => {
        switch (section) {
          case 'quests':
            return claimableQuests > 0;
          case 'achievements':
            return claimableAchievements > 0;
          case 'contracts':
            return claimableContracts > 0;
          case 'research':
            return availableResearch;
          case 'prestige':
            return canPrestige;
          case 'daily':
            return canClaimDaily;
          case 'events':
            return hasActiveEvent;
          default:
            return false;
        }
      },
      [
        claimableQuests,
        claimableAchievements,
        claimableContracts,
        availableResearch,
        canPrestige,
        canClaimDaily,
        hasActiveEvent,
      ]
    );

    // Count total badges in "More" menu
    const moreBadgeCount = visibleMoreSections.filter(s => hasBadge(s.id)).length;

    // Get accessible label for a tab
    const getTabLabel = useCallback(
      (label: string, section: Section): string => {
        const badge = hasBadge(section);
        return badge ? `${label}, has notifications` : label;
      },
      [hasBadge]
    );

    // Handle Escape key to close More menu
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && showMore) {
          setShowMore(false);
          moreButtonRef.current?.focus();
        }
      };

      if (showMore) {
        document.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }, [showMore]);

    // Focus first item in More menu when opened
    useEffect(() => {
      if (showMore && moreMenuRef.current) {
        const firstButton = moreMenuRef.current.querySelector('button');
        firstButton?.focus();
      }
    }, [showMore]);

    const handleMoreItemClick = (sectionId: Section) => {
      navigate({ to: getSectionPath(sectionId) });
      setShowMore(false);
      moreButtonRef.current?.focus();
    };

    const handleCloseMore = () => {
      setShowMore(false);
      moreButtonRef.current?.focus();
    };

    return (
      <>
        {/* More menu overlay */}
        {showMore && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={handleCloseMore}
            aria-hidden="true"
          />
        )}

        {/* More menu sheet */}
        <div
          id="more-menu"
          ref={moreMenuRef}
          role="dialog"
          aria-label="More navigation options"
          aria-modal="true"
          className={cn(
            'fixed bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 lg:hidden transition-transform duration-300 ease-out',
            showMore ? 'translate-y-0' : 'translate-y-full pointer-events-none'
          )}
        >
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg" id="more-menu-title">
                More
              </h3>
              <button
                onClick={handleCloseMore}
                className="p-2 rounded-full hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3" role="menu" aria-labelledby="more-menu-title">
              {visibleMoreSections.map(section => (
                <button
                  key={section.id}
                  role="menuitem"
                  onClick={() => handleMoreItemClick(section.id)}
                  aria-label={getTabLabel(section.label, section.id)}
                  aria-current={activeSection === section.id ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors relative',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                    activeSection === section.id
                      ? 'bg-primary/20 text-primary'
                      : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {section.icon}
                  <span className="text-xs font-medium">{section.label}</span>
                  {hasBadge(section.id) && (
                    <span
                      className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Settings button in More menu */}
            {onSettingsClick && (
              <>
                <div className="h-px bg-border my-4" aria-hidden="true" />
                <button
                  role="menuitem"
                  onClick={() => {
                    setShowMore(false);
                    onSettingsClick();
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom tab bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 lg:hidden safe-area-bottom"
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-around h-full px-2">
            {visiblePrimaryTabs.map(tab => (
              <Link
                key={tab.id}
                to={getSectionPath(tab.id)}
                aria-label={getTabLabel(tab.label, tab.id)}
                aria-current={activeSection === tab.id ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                  activeSection === tab.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.icon}
                <span className="text-[10px] font-medium">{tab.label}</span>
                {hasBadge(tab.id) && (
                  <span
                    className="absolute top-2 right-1/4 w-2 h-2 bg-primary rounded-full animate-pulse"
                    aria-hidden="true"
                  />
                )}
              </Link>
            ))}

            {/* More button */}
            <button
              ref={moreButtonRef}
              onClick={() => setShowMore(!showMore)}
              aria-expanded={showMore}
              aria-controls="more-menu"
              aria-label={`More navigation options${moreBadgeCount > 0 ? `, ${moreBadgeCount} items need attention` : ''}`}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                isMoreActive || showMore
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
              {moreBadgeCount > 0 && (
                <span
                  className="absolute top-2 right-1/4 w-2 h-2 bg-primary rounded-full animate-pulse"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </nav>
      </>
    );
  }
);

BottomNav.displayName = 'BottomNav';

export default BottomNav;
