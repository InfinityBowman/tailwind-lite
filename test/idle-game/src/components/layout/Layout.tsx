import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useGame } from '@/contexts/GameEngineContext';
import { isNavSectionUnlocked } from '@/game/config/unlocks';
import type { Section, FarmingSubSection } from '@/router';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: Section;
  activeSubSection?: FarmingSubSection;
  // Currency data
  credits: number;
  crystals: number;
  seedEssence: number;
  refinedEssence: number;
  incomeRate?: number;
  // Badge data
  claimableQuests: number;
  claimableAchievements: number;
  claimableContracts: number;
  availableResearch: boolean;
  canPrestige: boolean;
  prestigePoints: number;
  seedCount: number;
  managerCount: number;
  managerCrystals: number;
  canClaimDaily?: boolean;
  // Actions
  onSettingsClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeSection,
  activeSubSection,
  credits,
  crystals,
  seedEssence,
  refinedEssence,
  incomeRate,
  claimableQuests,
  claimableAchievements,
  claimableContracts,
  availableResearch,
  canPrestige,
  prestigePoints,
  seedCount,
  managerCount,
  managerCrystals,
  canClaimDaily = false,
  onSettingsClick,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { getActiveEvent, state } = useGame();
  // Only show event banner gap if events are unlocked AND there's an active event
  const eventsUnlocked = isNavSectionUnlocked('events', state);
  const hasActiveEvent = eventsUnlocked && !!getActiveEvent();

  return (
    <div className="min-h-screen">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          activeSection={activeSection}
          activeSubSection={activeSubSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          claimableQuests={claimableQuests}
          claimableAchievements={claimableAchievements}
          claimableContracts={claimableContracts}
          availableResearch={availableResearch}
          canPrestige={canPrestige}
          prestigePoints={prestigePoints}
          crystals={crystals}
          seedCount={seedCount}
          managerCount={managerCount}
          managerCrystals={managerCrystals}
          canClaimDaily={canClaimDaily}
          hasActiveEvent={hasActiveEvent}
        />
      </div>

      {/* Header */}
      <Header
        credits={credits}
        crystals={crystals}
        seedEssence={seedEssence}
        refinedEssence={refinedEssence}
        sidebarCollapsed={sidebarCollapsed}
        onSettingsClick={onSettingsClick}
        incomeRate={incomeRate}
        hasActiveEvent={hasActiveEvent}
      />

      {/* Main content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          // Desktop: sidebar margin
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56',
          // Mobile: no sidebar margin, but bottom padding for nav
          'ml-0 pb-20 lg:pb-0',
          hasActiveEvent ? 'pt-24' : 'pt-14'
        )}
      >
        <div className="max-w-6xl mx-auto p-4 lg:p-6">{children}</div>
      </main>

      {/* Bottom Navigation - mobile only */}
      <BottomNav
        activeSection={activeSection}
        claimableQuests={claimableQuests}
        claimableAchievements={claimableAchievements}
        claimableContracts={claimableContracts}
        availableResearch={availableResearch}
        canPrestige={canPrestige}
        canClaimDaily={canClaimDaily}
        hasActiveEvent={hasActiveEvent}
        onSettingsClick={onSettingsClick}
      />
    </div>
  );
};

export default Layout;
