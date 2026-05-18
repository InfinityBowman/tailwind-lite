/**
 * Stats Panel
 * Shows detailed game statistics and records
 */

import React, { useMemo } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Clock, Coins, Leaf, Sparkles, Target, Crown, Rocket, Users } from 'lucide-react';
import { formatNumber } from '../../game/utils/numberFormat';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, subtext }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
    <div className="text-slate-400">{icon}</div>
    <div className="flex-1">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-slate-500">{subtext}</div>}
    </div>
  </div>
);

const StatsPanel: React.FC = () => {
  const { state, getUnlockedAchievementCount, getTotalAchievementCount } = useGame();

  const stats = useMemo(() => {
    const achievementState = state.achievements;

    // Get total mastery from new XP-based system
    const totalMastery = state.mastery?.totalMasteryLevel || 0;

    return {
      // Currency stats
      totalCredits: state.ship.totalCurrency,
      lifetimeCredits: state.prestige.lifetimeCredits,
      crystals: state.ship.crystals || 0,

      // Progress stats
      planetsUnlocked: state.planets.filter(p => p.unlocked).length,
      totalPlanets: state.planets.length,
      researchComplete: state.research.completed?.length || 0,

      // Achievement stats
      achievementsUnlocked: getUnlockedAchievementCount(),
      totalAchievements: getTotalAchievementCount(),

      // Gacha stats
      totalPulls: achievementState.stats.totalGachaPulls,
      totalFusions: achievementState.stats.totalSeedsFused,
      maxTier: achievementState.stats.maxSeedTierCreated,

      // Prestige stats
      prestigeLevel: state.prestige.prestigeLevel,
      prestigePoints: state.prestige.prestigePoints,
      prestigeCount: achievementState.stats.prestigeCount,

      // Mastery
      totalMastery,

      // Managers
      managersOwned: state.managers.owned?.length || 0,

      // Time stats (playtime not tracked - would need game start timestamp)
      dailyStreak: state.dailyLogin.currentStreak,
      totalLogins: state.dailyLogin.totalLogins,
    };
  }, [state, getUnlockedAchievementCount, getTotalAchievementCount]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Statistics
        </h1>
        <p className="text-slate-400">Your journey through the cosmos, by the numbers.</p>
      </div>

      {/* Currency */}
      <Card className="bg-slate-900/80 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            Currency
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<Coins className="w-5 h-5" />}
            label="Current Credits"
            value={formatNumber(stats.totalCredits)}
          />
          <StatItem
            icon={<Coins className="w-5 h-5" />}
            label="Lifetime Credits"
            value={formatNumber(stats.lifetimeCredits)}
          />
          <StatItem
            icon={<Sparkles className="w-5 h-5" />}
            label="Crystals"
            value={formatNumber(stats.crystals)}
          />
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="bg-slate-900/80 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<Rocket className="w-5 h-5" />}
            label="Planets Unlocked"
            value={`${stats.planetsUnlocked} / ${stats.totalPlanets}`}
          />
          <StatItem
            icon={<Target className="w-5 h-5" />}
            label="Research Complete"
            value={stats.researchComplete}
          />
          <StatItem
            icon={<Trophy className="w-5 h-5" />}
            label="Achievements"
            value={`${stats.achievementsUnlocked} / ${stats.totalAchievements}`}
          />
          <StatItem
            icon={<Leaf className="w-5 h-5" />}
            label="Total Mastery"
            value={stats.totalMastery}
          />
        </CardContent>
      </Card>

      {/* Gacha & Collection */}
      <Card className="bg-slate-900/80 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<Sparkles className="w-5 h-5" />}
            label="Total Gacha Pulls"
            value={formatNumber(stats.totalPulls)}
          />
          <StatItem
            icon={<Leaf className="w-5 h-5" />}
            label="Seeds Fused"
            value={formatNumber(stats.totalFusions)}
          />
          <StatItem
            icon={<Crown className="w-5 h-5" />}
            label="Max Tier Created"
            value={`T${stats.maxTier}`}
          />
          <StatItem
            icon={<Users className="w-5 h-5" />}
            label="Managers Owned"
            value={stats.managersOwned}
          />
        </CardContent>
      </Card>

      {/* Prestige */}
      <Card className="bg-slate-900/80 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            Prestige
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<Crown className="w-5 h-5" />}
            label="Prestige Level"
            value={stats.prestigeLevel}
          />
          <StatItem
            icon={<Sparkles className="w-5 h-5" />}
            label="Available Points"
            value={stats.prestigePoints}
          />
          <StatItem
            icon={<Target className="w-5 h-5" />}
            label="Times Prestiged"
            value={stats.prestigeCount}
          />
        </CardContent>
      </Card>

      {/* Time */}
      <Card className="bg-slate-900/80 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            Time
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<Clock className="w-5 h-5" />}
            label="Current Streak"
            value={`${stats.dailyStreak} days`}
          />
          <StatItem
            icon={<Target className="w-5 h-5" />}
            label="Total Logins"
            value={stats.totalLogins}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsPanel;
