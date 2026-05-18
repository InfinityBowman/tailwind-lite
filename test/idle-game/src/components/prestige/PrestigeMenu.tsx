/**
 * Prestige Menu Component
 * Displays prestige points, available bonuses, and prestige button
 */

import React, { useState } from 'react';
import { useGameContext } from '../../contexts/GameEngineContext';
import { PRESTIGE_CONFIG } from '../../game/config/prestige';
import PrestigeConfirmModal from './PrestigeConfirmModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Trophy, Coins, TrendingUp, Zap, FlaskConical, Leaf } from 'lucide-react';
import { OnboardingHint, GAME_HINTS } from '@/components/ui';

const PrestigeMenu: React.FC = () => {
  const {
    state,
    canPrestige,
    prestige,
    purchasePrestigeBonus,
    getPrestigeBonuses,
    getProjectedPrestigePoints,
    dismissHint,
    isHintDismissed,
  } = useGameContext();

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const prestigeState = state.prestige;
  const prestigeCheck = canPrestige();
  const bonuses = getPrestigeBonuses();

  // Calculate projected points based on current lifetime credits
  const projectedPoints = getProjectedPrestigePoints(prestigeState.lifetimeCredits);
  const progressPercent = Math.min(
    100,
    (prestigeState.lifetimeCredits / PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE) * 100
  );

  const handlePrestige = async () => {
    const result = await prestige();
    if (result.success) {
      setShowConfirmModal(false);
    }
  };

  const handlePurchaseBonus = async (bonusId: string) => {
    const result = await purchasePrestigeBonus(bonusId);
    if (!result.success) {
      console.warn('Failed to purchase bonus:', result.error);
    }
  };

  const formatEffect = (bonus: (typeof bonuses)[0]) => {
    const { bonus: b, currentValue } = bonus;

    switch (b.effect) {
      case 'STARTING_CREDITS':
        return `+${currentValue.toLocaleString()} credits`;
      case 'PRODUCTION_MULT':
        return `+${(currentValue * 100).toFixed(0)}% production`;
      case 'GACHA_LUCK':
        return `+${(currentValue * 100).toFixed(0)}% luck`;
      case 'EXPORT_SPEED':
        return `+${(currentValue * 100).toFixed(0)}% export speed`;
      case 'RESEARCH_DISCOUNT':
        return `-${(currentValue * 100).toFixed(0)}% research cost`;
      case 'SEED_POWER':
        return `+${(currentValue * 100).toFixed(0)}% seed power`;
      default:
        return `${currentValue}`;
    }
  };

  const getEffectIcon = (effect: string) => {
    switch (effect) {
      case 'STARTING_CREDITS':
        return <Coins className="w-4 h-4" />;
      case 'PRODUCTION_MULT':
        return <TrendingUp className="w-4 h-4" />;
      case 'GACHA_LUCK':
        return <Star className="w-4 h-4" />;
      case 'EXPORT_SPEED':
        return <Zap className="w-4 h-4" />;
      case 'RESEARCH_DISCOUNT':
        return <FlaskConical className="w-4 h-4" />;
      case 'SEED_POWER':
        return <Leaf className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  // Show hint when prestige is available but never done
  const showPrestigeHint = prestigeCheck.canPrestige && state.hints && !state.hints.firstPrestige;

  return (
    <div className="space-y-6">
      {/* Onboarding hint */}
      {showPrestigeHint && (
        <OnboardingHint
          {...GAME_HINTS.prestige}
          onDismiss={dismissHint}
          dismissed={isHintDismissed(GAME_HINTS.prestige.id)}
        />
      )}

      {/* Header Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="w-5 h-5 text-yellow-400" />
              Prestige
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="prestige" className="gap-1.5">
                <Trophy className="w-3 h-3" />
                Level {prestigeState.prestigeLevel}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 tabular-nums">
                <Star className="w-3 h-3" />
                {prestigeState.prestigePoints} Points
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Section */}
          <Card className="bg-secondary/50 border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Lifetime Credits</span>
                <span className="text-yellow-400 font-bold tabular-nums">
                  {prestigeState.lifetimeCredits.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Required</span>
                <span className="text-muted-foreground tabular-nums">
                  {PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE.toLocaleString()}
                </span>
              </div>

              <Progress
                value={progressPercent}
                className="h-3"
                indicatorClassName={prestigeCheck.canPrestige ? 'bg-green-500' : 'bg-yellow-500'}
              />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Points on Prestige</span>
                <span
                  className={`font-bold text-lg flex items-center gap-1.5 tabular-nums ${projectedPoints > 0 ? 'text-green-400' : 'text-muted-foreground'}`}
                >
                  +{projectedPoints}
                  <Star className="w-4 h-4 text-yellow-400" />
                </span>
              </div>

              <Button
                onClick={() => setShowConfirmModal(true)}
                disabled={!prestigeCheck.canPrestige}
                variant={prestigeCheck.canPrestige ? 'prestige' : 'secondary'}
                size="xl"
                className="w-full gap-2"
              >
                {prestigeCheck.canPrestige ? (
                  <>
                    <Star className="w-4 h-4" />
                    <span className="tabular-nums">
                      Prestige for {prestigeCheck.potentialPoints} Points
                    </span>
                    <Star className="w-4 h-4" />
                  </>
                ) : (
                  prestigeCheck.reason || 'Cannot Prestige Yet'
                )}
              </Button>

              {/* Current run quick stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">This Run</p>
                  <p className="text-sm font-medium text-yellow-400 tabular-nums">
                    {prestigeState.lifetimeCredits.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Planets</p>
                  <p className="text-sm font-medium tabular-nums">
                    {state.planets.filter(p => p.unlocked).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Research</p>
                  <p className="text-sm font-medium tabular-nums">
                    {state.research.completed.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Prestige Bonuses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Permanent Bonuses</CardTitle>
          <CardDescription>
            Spend prestige points on upgrades that persist through resets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bonuses.map(bonus => {
              const canAfford = prestigeState.prestigePoints >= (bonus.nextCost || 0);
              const isMaxed = bonus.isMaxed;

              return (
                <Card
                  key={bonus.bonus.id}
                  className={`transition-all border-border/50 ${
                    isMaxed
                      ? 'border-yellow-500/50 bg-yellow-500/5'
                      : canAfford
                        ? 'border-primary/50 hover:border-primary bg-primary/5'
                        : 'bg-secondary/30'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${isMaxed ? 'bg-yellow-500/20' : 'bg-primary/20'}`}
                        >
                          {getEffectIcon(bonus.bonus.effect)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm">{bonus.bonus.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {bonus.bonus.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs tabular-nums shrink-0 ml-2">
                        {bonus.currentLevel}/{bonus.bonus.maxLevel}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span
                        className={`text-sm ${bonus.currentLevel > 0 ? 'text-green-400' : 'text-muted-foreground'}`}
                      >
                        {bonus.currentLevel > 0 ? formatEffect(bonus) : 'Not purchased'}
                      </span>

                      {!isMaxed ? (
                        <Button
                          onClick={() => handlePurchaseBonus(bonus.bonus.id)}
                          disabled={!canAfford}
                          variant={canAfford ? 'default' : 'secondary'}
                          size="sm"
                          className="gap-1.5 tabular-nums"
                        >
                          <Star className="w-3 h-3" />
                          {bonus.nextCost}
                        </Button>
                      ) : (
                        <Badge variant="prestige" className="gap-1.5">
                          <Trophy className="w-3 h-3" />
                          MAX
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Card className="bg-secondary/50 border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="stats-label mb-1">Total Earned</p>
              <p className="text-lg font-bold text-purple-400 tabular-nums">
                {prestigeState.totalPrestigePointsEarned}
              </p>
            </div>
            <div className="text-center">
              <p className="stats-label mb-1">Spent</p>
              <p className="text-lg font-bold text-muted-foreground tabular-nums">
                {prestigeState.totalPrestigePointsEarned - prestigeState.prestigePoints}
              </p>
            </div>
            <div className="text-center">
              <p className="stats-label mb-1">Available</p>
              <p className="text-lg font-bold text-green-400 tabular-nums">
                {prestigeState.prestigePoints}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <PrestigeConfirmModal
          potentialPoints={prestigeCheck.potentialPoints}
          newLevel={prestigeState.prestigeLevel + 1}
          onConfirm={handlePrestige}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default PrestigeMenu;
