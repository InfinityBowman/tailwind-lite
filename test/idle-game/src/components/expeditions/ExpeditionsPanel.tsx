/**
 * Expeditions Panel
 * Main container for the expedition system - shows active expeditions and history
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { InfoCard, OnboardingHint, GAME_HINTS } from '../ui';
import { cn } from '../../lib/utils';
import { Rocket, History, Trophy, CheckCircle, XCircle, Coins, Gem, Leaf } from 'lucide-react';
import ExpeditionCard from './ExpeditionCard';
import ExpeditionSetup from './ExpeditionSetup';
import {
  getCompletedExpeditions,
  getExpeditionStats,
  type ExpeditionResult,
} from '../../game/systems/ExpeditionSystem';
import { EXPEDITION_TYPES } from '../../game/config/expeditions';

type TabId = 'active' | 'history';

const ExpeditionsPanel: React.FC = () => {
  const {
    state,
    dismissHint,
    isHintDismissed,
    launchExpedition,
    collectExpedition,
    cancelExpedition,
  } = useGame();

  const [activeTab, setActiveTab] = useState<TabId>('active');
  const [showSetup, setShowSetup] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update time every second for countdown display
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Get expedition stats
  const stats = getExpeditionStats(state.expeditions);
  const completedExpeditions = getCompletedExpeditions(state.expeditions, now);

  const handleLaunch = useCallback(
    async (typeId: string, managerIds: string[], supplyIds?: string[]) => {
      const result = await launchExpedition(typeId, managerIds, supplyIds);
      if (result.success) {
        setShowSetup(false);
      }
    },
    [launchExpedition]
  );

  const handleCollect = useCallback(
    async (expeditionId: string) => {
      await collectExpedition(expeditionId);
    },
    [collectExpedition]
  );

  const handleCancel = useCallback(
    async (expeditionId: string) => {
      await cancelExpedition(expeditionId);
    },
    [cancelExpedition]
  );

  // Show hint for players who haven't launched an expedition
  const showExpeditionsHint =
    stats.totalCompleted === 0 && !isHintDismissed(GAME_HINTS.expeditions.id);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Onboarding hint */}
      {showExpeditionsHint && (
        <OnboardingHint
          {...GAME_HINTS.expeditions}
          onDismiss={dismissHint}
          dismissed={isHintDismissed(GAME_HINTS.expeditions.id)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Rocket className="w-8 h-8 text-blue-400" />
          Expeditions
        </h1>
        <p className="text-muted-foreground">
          Send your managers on missions to discover rare rewards.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Rocket className="w-4 h-4" />
              Active Slots
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.slotsUsed}/{stats.slotsTotal}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Trophy className="w-4 h-4" />
              Total Completed
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalCompleted}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <CheckCircle className="w-4 h-4" />
              Success Rate
            </div>
            <div className="text-2xl font-bold text-white">
              {Math.round(stats.successRate * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab navigation */}
      <div
        className="flex gap-2 border-b border-slate-700 pb-2"
        role="tablist"
        aria-label="Expedition tabs"
      >
        <button
          id="active-tab"
          onClick={() => setActiveTab('active')}
          role="tab"
          aria-selected={activeTab === 'active'}
          aria-controls="active-expeditions"
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
            activeTab === 'active'
              ? 'bg-slate-800 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          )}
        >
          <Rocket className="w-4 h-4" />
          Active
          {completedExpeditions.length > 0 && (
            <span
              className="ml-1 px-1.5 py-0.5 rounded-full bg-green-500 text-xs text-white"
              aria-label={`${completedExpeditions.length} ready to collect`}
            >
              {completedExpeditions.length}
            </span>
          )}
        </button>
        <button
          id="history-tab"
          onClick={() => setActiveTab('history')}
          role="tab"
          aria-selected={activeTab === 'history'}
          aria-controls="expedition-history"
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
            activeTab === 'history'
              ? 'bg-slate-800 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          )}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Active tab content */}
      {activeTab === 'active' && (
        <div
          id="active-expeditions"
          role="tabpanel"
          aria-labelledby="active-tab"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Active expedition slots */}
          {Array.from({ length: state.expeditions.maxSlots }).map((_, i) => {
            const expedition = state.expeditions.active[i];
            return (
              <ExpeditionCard
                key={i}
                expedition={expedition}
                slotIndex={i}
                now={now}
                onStart={() => setShowSetup(true)}
                onCollect={() => expedition && handleCollect(expedition.id)}
                onCancel={() => expedition && handleCancel(expedition.id)}
              />
            );
          })}

          {/* Locked slots indicator */}
          {state.expeditions.maxSlots < 5 && (
            <ExpeditionCard
              slotIndex={state.expeditions.maxSlots}
              isLocked
              unlockRequirement="Unlock via Research"
            />
          )}
        </div>
      )}

      {/* History tab content */}
      {activeTab === 'history' && (
        <Card id="expedition-history" role="tabpanel" aria-labelledby="history-tab">
          <CardHeader>
            <CardTitle>Recent Expeditions</CardTitle>
            <CardDescription>
              Your last {state.expeditions.history.length} completed expeditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.expeditions.history.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No expeditions completed yet</p>
                <p className="text-sm">Start your first expedition above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.expeditions.history.map((result, i) => (
                  <HistoryItem key={i} result={result} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <InfoCard title="How Expeditions Work" variant="info">
        Assign managers to expeditions to earn bonus rewards while they&apos;re away. Higher rarity
        managers and team synergies increase success rates and reward quality. Managers on
        expeditions cannot be assigned to planets.
      </InfoCard>

      {/* Setup dialog */}
      <ExpeditionSetup
        open={showSetup}
        onClose={() => setShowSetup(false)}
        onLaunch={handleLaunch}
        expeditionState={state.expeditions}
        managerState={state.managers}
        craftingState={state.crafting}
      />
    </div>
  );
};

// History item component
const HistoryItem: React.FC<{ result: ExpeditionResult }> = ({ result }) => {
  const type = EXPEDITION_TYPES[result.typeId];
  const completedDate = new Date(result.completedAt);

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 border border-white/5">
      <div className={`p-2 rounded-lg ${result.success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        {result.success ? (
          <CheckCircle className="w-5 h-5 text-green-400" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{type.name}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {result.success ? 'Success' : 'Failed'}
          </span>
        </div>
        <div className="text-xs text-slate-500">
          {completedDate.toLocaleDateString()} {completedDate.toLocaleTimeString()}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-end">
        {result.rewards.map((reward, i) => (
          <div
            key={i}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700/50 text-xs"
          >
            {reward.type === 'credits' && <Coins className="w-3 h-3 text-yellow-400" />}
            {reward.type === 'crystals' && <Gem className="w-3 h-3 text-purple-400" />}
            {reward.type === 'seeds' && <Leaf className="w-3 h-3 text-green-400" />}
            {reward.type === 'fragments' && <Gem className="w-3 h-3 text-blue-400" />}
            <span className="text-slate-300">{reward.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpeditionsPanel;
