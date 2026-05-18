/**
 * Managers Panel
 * Main container for the manager system - shows gacha and collection tabs
 */

import React, { useState, useCallback } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { InfoCard, OnboardingHint, GAME_HINTS } from '../ui';
import { UserPlus, Users, Crown, Globe } from 'lucide-react';
import ManagerGacha from './ManagerGacha';
import ManagerList from './ManagerList';
import ManagerDetailPanel from './ManagerDetailPanel';
import type { ManagerInstance } from '../../game/systems/ManagerSystem';
import {
  TEAM_BONUSES,
  getActiveTeamBonuses,
  MANAGER_TEMPLATES,
  getSkillLabel,
} from '../../game/config/managers';
import {
  calculateGlobalSecondaryBonuses,
  getAwakenedManagersWithBonuses,
} from '../../game/systems/ManagerSystem';

const ManagersPanel: React.FC = () => {
  const gameEngine = useGame();
  const {
    state,
    pullManager,
    multiPullManager,
    dismissHint,
    isHintDismissed,
    equipToManager,
    unequipFromManager,
  } = gameEngine;
  const [selectedManager, setSelectedManager] = useState<ManagerInstance | null>(null);

  const handlePull = useCallback(async () => {
    const result = await pullManager();
    if (!result.success || !result.manager) return null;
    // Convert Convex response to ManagerPullResult format
    const manager = result.manager as ManagerInstance;
    const template = MANAGER_TEMPLATES[manager.templateId];
    if (!template) return null;
    return {
      manager,
      template,
      isNew: true, // New pulls are always new
      leveledUp: false,
      newLevel: manager.level,
      isAwakened: manager.isAwakened ?? false,
    };
  }, [pullManager]);

  const handleMultiPull = useCallback(async () => {
    const result = await multiPullManager();
    if (!result.success || !result.managers) return null;
    // Convert Convex response to ManagerPullResult[] format
    return (result.managers as ManagerInstance[]).map(manager => {
      const template = MANAGER_TEMPLATES[manager.templateId];
      return {
        manager,
        template: template || {
          id: manager.templateId,
          name: 'Unknown',
          rarity: 'common' as const,
          icon: 'User',
          skill: { type: 'production' as const, value: 0 },
          team: 'solo' as const,
          secondarySkill: undefined,
        },
        isNew: true,
        leveledUp: false,
        newLevel: manager.level,
        isAwakened: manager.isAwakened ?? false,
      };
    });
  }, [multiPullManager]);

  const handleSelectManager = (manager: ManagerInstance) => {
    setSelectedManager(prev => (prev?.instanceId === manager.instanceId ? null : manager));
  };

  // Get active team bonuses
  const ownedManagerIds = state.managers.owned.map(m => m.templateId);
  const activeTeamBonuses = getActiveTeamBonuses(ownedManagerIds);

  // Get global secondary bonuses from awakened managers
  const globalBonuses = calculateGlobalSecondaryBonuses(state.managers);
  const awakenedManagersWithBonuses = getAwakenedManagersWithBonuses(state.managers);

  // Check if any global bonuses are active
  const hasGlobalBonuses = Object.values(globalBonuses).some(v => v > 0);

  // Show hint only for players who have never pulled a manager
  // (pullCount tracks total pulls, so this won't re-trigger for players who sold/dismissed managers)
  const showManagersHint =
    state.managers.pullCount === 0 && !isHintDismissed(GAME_HINTS.managers.id);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Onboarding hint */}
      {showManagersHint && (
        <OnboardingHint
          {...GAME_HINTS.managers}
          onDismiss={dismissHint}
          dismissed={isHintDismissed(GAME_HINTS.managers.id)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-pink-400" />
          Managers
        </h1>
        <p className="text-muted-foreground">
          Recruit managers to boost your planets and unlock team synergies.
        </p>
      </div>

      <Tabs defaultValue="recruit" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="recruit" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Recruit
          </TabsTrigger>
          <TabsTrigger value="collection" className="gap-2">
            <Users className="w-4 h-4" />
            Collection
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <Crown className="w-4 h-4" />
            Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recruit" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ManagerGacha
                managerState={state.managers}
                crystals={state.ship.crystals}
                onPull={handlePull}
                onMultiPull={handleMultiPull}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collection" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Managers</CardTitle>
                  <CardDescription>
                    Click on a manager to view details and equip items.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ManagerList
                    managerState={state.managers}
                    crystals={state.ship.crystals}
                    onSelectManager={handleSelectManager}
                    selectedManagerId={selectedManager?.instanceId}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Manager Detail Panel */}
            <div className="lg:col-span-1">
              {selectedManager ? (
                <ManagerDetailPanel
                  manager={selectedManager}
                  craftingState={state.crafting}
                  onEquip={equipToManager}
                  onUnequip={unequipFromManager}
                  onClose={() => setSelectedManager(null)}
                  isAssigned={Object.values(state.managers.assignments).includes(
                    selectedManager.instanceId
                  )}
                  assignedPlanet={
                    Object.entries(state.managers.assignments).find(
                      ([_, id]) => id === selectedManager.instanceId
                    )?.[0]
                  }
                />
              ) : (
                <Card className="bg-slate-800/50 border-white/10">
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <p className="text-slate-400">Select a manager to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Synergies</CardTitle>
              <CardDescription>
                Collect managers from the same team to unlock powerful bonuses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEAM_BONUSES.map(bonus => {
                  const teamManagers = ownedManagerIds.filter(id => {
                    const template = MANAGER_TEMPLATES[id];
                    return template?.team === bonus.team;
                  });
                  const isActive = teamManagers.length >= bonus.required;

                  return (
                    <div
                      key={bonus.team}
                      className={`p-4 rounded-lg border transition-all ${
                        isActive
                          ? 'bg-green-500/10 border-green-500/50'
                          : 'bg-card border-border opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-white">{bonus.name}</h3>
                        <span
                          className={`text-sm ${isActive ? 'text-green-400' : 'text-muted-foreground'}`}
                        >
                          {teamManagers.length}/{bonus.required}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2 capitalize">
                        {bonus.team} team
                      </p>

                      <div className={`text-sm ${isActive ? 'text-green-400' : 'text-slate-400'}`}>
                        +{Math.round(bonus.skill.value * 100)}% {getSkillLabel(bonus.skill.type)}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${isActive ? 'bg-green-500' : 'bg-slate-500'}`}
                          style={{
                            width: `${Math.min(100, (teamManagers.length / bonus.required) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active team bonuses summary */}
              {activeTeamBonuses.length > 0 && (
                <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/50">
                  <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Active Team Bonuses
                  </h4>
                  <ul className="space-y-1">
                    {activeTeamBonuses.map(bonus => (
                      <li key={bonus.team} className="text-sm text-green-300">
                        {bonus.name}: +{Math.round(bonus.skill.value * 100)}%{' '}
                        {getSkillLabel(bonus.skill.type)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Global secondary bonuses from awakened managers */}
              {hasGlobalBonuses && (
                <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/50">
                  <h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Global Awakening Bonuses
                  </h4>
                  <p className="text-xs text-yellow-300/70 mb-3">
                    These bonuses apply to ALL planets from awakened managers
                  </p>
                  <ul className="space-y-1">
                    {globalBonuses.productionBoost > 0 && (
                      <li className="text-sm text-yellow-300">
                        +{Math.round(globalBonuses.productionBoost * 100)}% Production (Global)
                      </li>
                    )}
                    {globalBonuses.sellValueBoost > 0 && (
                      <li className="text-sm text-yellow-300">
                        +{Math.round(globalBonuses.sellValueBoost * 100)}% Sell Value (Global)
                      </li>
                    )}
                    {globalBonuses.exportSpeed > 0 && (
                      <li className="text-sm text-yellow-300">
                        +{Math.round(globalBonuses.exportSpeed * 100)}% Export Speed (Global)
                      </li>
                    )}
                    {globalBonuses.storageCapacity > 0 && (
                      <li className="text-sm text-yellow-300">
                        +{Math.round(globalBonuses.storageCapacity * 100)}% Storage Capacity
                        (Global)
                      </li>
                    )}
                    {globalBonuses.researchDiscount > 0 && (
                      <li className="text-sm text-yellow-300">
                        +{Math.round(globalBonuses.researchDiscount * 100)}% Research Discount
                        (Global)
                      </li>
                    )}
                    {globalBonuses.gachaLuck > 0 && (
                      <li className="text-sm text-yellow-300">
                        +{Math.round(globalBonuses.gachaLuck * 100)}% Gacha Luck (Global)
                      </li>
                    )}
                  </ul>

                  {/* List awakened managers providing these bonuses */}
                  <div className="mt-3 pt-3 border-t border-yellow-500/30">
                    <p className="text-xs text-yellow-300/70 mb-2">Contributing managers:</p>
                    <div className="flex flex-wrap gap-1">
                      {awakenedManagersWithBonuses.map(({ manager, template }) => (
                        <span
                          key={manager.instanceId}
                          className="text-xs px-2 py-0.5 bg-yellow-500/20 rounded text-yellow-300"
                        >
                          {template.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info card */}
      <InfoCard title="How Managers Work" variant="info">
        Managers provide production bonuses and can be assigned to planets for additional effects.
        Collect duplicates to level up managers and unlock awakening at max level. Build teams of
        the same type to unlock synergy bonuses!
      </InfoCard>
    </div>
  );
};

export default ManagersPanel;
