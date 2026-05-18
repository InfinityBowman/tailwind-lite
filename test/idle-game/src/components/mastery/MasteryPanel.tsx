/**
 * Mastery Panel
 * Main mastery view showing all seed masteries with XP progress
 *
 * Uses full XP-based MasteryState from MasterySystem
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Grid, List, Search, Star, Lock, Droplets, Gift } from 'lucide-react';
import { Button } from '../ui/button';
import { OnboardingHint, GAME_HINTS } from '../ui';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MasteryState } from '../../game/systems/MasterySystem';
import {
  getXpForLevel,
  getPoolProgress,
  getGlobalMasteryBonuses,
  MASTERY_CONFIG,
} from '../../game/systems/MasterySystem';
import { SEED_TYPES } from '../../game/config/seeds';
import { useGame } from '../../contexts/GameEngineContext';

interface MasteryPanelProps {
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'level' | 'name' | 'xp';

// Format large numbers
function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(0);
}

const MasteryPanel: React.FC<MasteryPanelProps> = ({ className }) => {
  const { state: gameState, dismissHint, isHintDismissed } = useGame();
  const state: MasteryState = gameState.mastery;
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('level');
  const [searchQuery, setSearchQuery] = useState('');

  // Get all seeds with mastery data
  const allSeeds = Object.keys(SEED_TYPES).map(seedId => {
    const mastery = state.seedMasteries[seedId];
    return {
      seedId,
      seedName: SEED_TYPES[seedId].name,
      level: mastery?.level || 0,
      xp: mastery?.xp || 0,
      totalXp: mastery?.totalXp || 0,
    };
  });

  // Filter by search
  const filteredSeeds = searchQuery
    ? allSeeds.filter(s => s.seedName.toLowerCase().includes(searchQuery.toLowerCase()))
    : allSeeds;

  // Sort seeds
  const sortedSeeds = [...filteredSeeds].sort((a, b) => {
    switch (sortMode) {
      case 'level':
        return b.level - a.level || b.totalXp - a.totalXp;
      case 'xp':
        return b.totalXp - a.totalXp;
      case 'name':
        return a.seedName.localeCompare(b.seedName);
      default:
        return 0;
    }
  });

  // Calculate totals
  const totalMastery = state.totalMasteryLevel;
  const maxMastery = Object.keys(SEED_TYPES).length * MASTERY_CONFIG.maxLevel;
  const poolProgress = getPoolProgress(state);
  const globalBonuses = getGlobalMasteryBonuses(state);

  // Show hint for players who haven't gained any mastery yet
  const hasMastery = Object.values(state.seedMasteries).some(m => m.level > 0);
  const showMasteryHint = !hasMastery && !isHintDismissed(GAME_HINTS.mastery.id);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Onboarding hint */}
      {showMasteryHint && (
        <OnboardingHint
          {...GAME_HINTS.mastery}
          onDismiss={dismissHint}
          dismissed={isHintDismissed(GAME_HINTS.mastery.id)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Seed Mastery</h2>
            <p className="text-sm text-slate-400">Gain XP from harvests to level up seeds</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Total Mastery</div>
          <div className="text-lg font-bold text-purple-400">
            {totalMastery} / {maxMastery}
          </div>
        </div>
      </div>

      {/* Global Mastery Pool */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-700/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-white">Global Mastery Pool</span>
            </div>
            <span className="text-sm text-slate-400">
              {formatNumber(state.globalPool)} / {formatNumber(state.globalPoolMax)}
            </span>
          </div>

          <Progress value={poolProgress * 100} className="h-3 mb-3" />

          {/* Pool Checkpoints */}
          <div className="flex justify-between mt-2">
            {state.poolCheckpoints.map(checkpoint => (
              <div
                key={checkpoint.percentage}
                className={cn(
                  'flex flex-col items-center text-xs',
                  checkpoint.claimed ? 'text-purple-400' : 'text-slate-500'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center mb-1',
                    checkpoint.claimed
                      ? 'bg-purple-600/30 border border-purple-500'
                      : 'bg-slate-800 border border-slate-600'
                  )}
                >
                  {checkpoint.claimed ? (
                    <Star className="w-3 h-3 fill-current" />
                  ) : (
                    <Gift className="w-3 h-3" />
                  )}
                </div>
                <span>{checkpoint.percentage}%</span>
              </div>
            ))}
          </div>

          {/* Active Global Bonuses */}
          {(globalBonuses.productionBonus > 0 ||
            globalBonuses.sellValueBonus > 0 ||
            globalBonuses.gachaLuckBonus > 0) && (
            <div className="mt-3 pt-3 border-t border-purple-700/30 flex flex-wrap gap-2">
              {globalBonuses.productionBonus > 0 && (
                <span className="px-2 py-1 bg-green-900/30 border border-green-700/50 rounded text-xs text-green-400">
                  +{(globalBonuses.productionBonus * 100).toFixed(0)}% Production
                </span>
              )}
              {globalBonuses.sellValueBonus > 0 && (
                <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs text-yellow-400">
                  +{(globalBonuses.sellValueBonus * 100).toFixed(0)}% Sell Value
                </span>
              )}
              {globalBonuses.gachaLuckBonus > 0 && (
                <span className="px-2 py-1 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-400">
                  +{(globalBonuses.gachaLuckBonus * 100).toFixed(0)}% Gacha Luck
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search seeds..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        {/* Sort */}
        <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
          <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="level">Sort by Level</SelectItem>
            <SelectItem value="xp">Sort by Total XP</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex gap-1 p-1 bg-slate-800 rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Seed Grid/List */}
      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-2'
        )}
      >
        {sortedSeeds.map(seed => (
          <SeedMasteryCard
            key={seed.seedId}
            seedId={seed.seedId}
            seedName={seed.seedName}
            level={seed.level}
            xp={seed.xp}
            totalXp={seed.totalXp}
            compact={viewMode === 'list'}
          />
        ))}
      </div>

      {filteredSeeds.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No seeds found matching &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
};

// Inline seed mastery card component
interface SeedMasteryCardProps {
  seedId: string;
  seedName: string;
  level: number;
  xp: number;
  totalXp: number;
  compact?: boolean;
}

// Mastery milestones for display
const DISPLAY_MILESTONES = [
  { level: 25, bonus: '+10% production' },
  { level: 50, bonus: '+5% sell value' },
  { level: 75, bonus: '+1 fusion tier' },
  { level: 99, bonus: '+100% production' },
];

const SeedMasteryCard: React.FC<SeedMasteryCardProps> = ({
  seedId: _seedId,
  seedName,
  level,
  xp,
  totalXp,
  compact,
}) => {
  const nextMilestone = DISPLAY_MILESTONES.find(m => m.level > level);
  const isMaxLevel = level >= MASTERY_CONFIG.maxLevel;

  // Calculate XP progress to next level
  const xpNeeded = isMaxLevel ? 0 : getXpForLevel(level + 1);
  const xpProgress = isMaxLevel ? 100 : xpNeeded > 0 ? (xp / xpNeeded) * 100 : 0;

  if (compact) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="font-medium text-white">{seedName}</div>
              <div className="text-xs text-slate-400">
                {isMaxLevel ? 'Maxed!' : `${xp} / ${xpNeeded} XP`}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-400">Lv. {level}</div>
            <div className="text-xs text-slate-400">
              {!isMaxLevel && nextMilestone && `Next: Lv. ${nextMilestone.level}`}
              {isMaxLevel && <span className="text-yellow-400">★ Master</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'bg-slate-800/50 border-slate-700',
        isMaxLevel && 'border-yellow-600/50 bg-gradient-to-br from-slate-800/50 to-yellow-900/10'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                isMaxLevel ? 'bg-yellow-600/20' : 'bg-purple-600/20'
              )}
            >
              <Sparkles
                className={cn('w-4 h-4', isMaxLevel ? 'text-yellow-400' : 'text-purple-400')}
              />
            </div>
            <CardTitle className="text-base">{seedName}</CardTitle>
          </div>
          <div
            className={cn('text-lg font-bold', isMaxLevel ? 'text-yellow-400' : 'text-purple-400')}
          >
            Lv. {level}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* XP Progress bar */}
        <div className="space-y-1">
          <Progress
            value={xpProgress}
            className={cn('h-2', isMaxLevel && '[&>div]:bg-yellow-500')}
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{isMaxLevel ? 'MAX LEVEL' : `${xp} / ${xpNeeded} XP`}</span>
            <span>Total: {formatNumber(totalXp)} XP</span>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-1">
          {DISPLAY_MILESTONES.map(milestone => (
            <div
              key={milestone.level}
              className={cn(
                'flex items-center gap-2 text-xs',
                level >= milestone.level ? 'text-purple-400' : 'text-slate-500'
              )}
            >
              {level >= milestone.level ? (
                <Star className="w-3 h-3 fill-current" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              <span>
                Lv. {milestone.level}: {milestone.bonus}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MasteryPanel;
