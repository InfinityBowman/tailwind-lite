/**
 * Transcendence Panel Component
 * Displays transcendence (Layer 2 prestige) options and bonuses
 */

import React, { useState } from 'react';
import { useGameContext } from '../../contexts/GameEngineContext';
import { TRANSCENDENCE_CONFIG } from '../../game/config/transcendence';
import TranscendenceConfirmModal from './TranscendenceConfirmModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Crown, Star, TrendingUp, Zap, Gem, Leaf, Rocket } from 'lucide-react';

const TranscendencePanel: React.FC = () => {
  const {
    state,
    canTranscend,
    transcend,
    purchaseTranscendenceBonus,
    getTranscendenceBonuses,
    getProjectedTranscendencePoints,
  } = useGameContext();

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const transcendenceState = state.transcendence;
  const prestigeLevel = state.prestige.prestigeLevel;
  const transcendenceCheck = canTranscend();
  const bonuses = getTranscendenceBonuses();

  // Calculate projected points based on current prestige level
  const projectedPoints = getProjectedTranscendencePoints(prestigeLevel);
  const progressPercent = Math.min(
    100,
    (prestigeLevel / TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL) * 100
  );

  const handleTranscend = async () => {
    const result = await transcend();
    if (result.success) {
      setShowConfirmModal(false);
    }
  };

  const handlePurchaseBonus = async (bonusId: string) => {
    const result = await purchaseTranscendenceBonus(bonusId);
    if (!result.success) {
      console.warn('Failed to purchase transcendence bonus:', result.error);
    }
  };

  const formatEffect = (bonus: (typeof bonuses)[0]) => {
    const { bonus: b, currentValue } = bonus;

    switch (b.effect) {
      case 'PRESTIGE_POINT_MULT':
        return `+${(currentValue * 100).toFixed(0)}% prestige points`;
      case 'STARTING_PRESTIGE':
        return `+${currentValue.toFixed(0)} starting levels`;
      case 'PRODUCTION_MULT':
        return `+${(currentValue * 100).toFixed(0)}% production`;
      case 'AUTOMATION_SPEED':
        return `+${(currentValue * 100).toFixed(0)}% automation`;
      case 'CRYSTAL_FIND':
        return `+${(currentValue * 100).toFixed(0)}% crystal find`;
      case 'SEED_TIER_BOOST':
        return `+${(currentValue * 100).toFixed(0)}% tier boost`;
      default:
        return `${currentValue}`;
    }
  };

  const getEffectIcon = (effect: string) => {
    switch (effect) {
      case 'PRESTIGE_POINT_MULT':
        return <Star className="w-4 h-4" />;
      case 'STARTING_PRESTIGE':
        return <Rocket className="w-4 h-4" />;
      case 'PRODUCTION_MULT':
        return <TrendingUp className="w-4 h-4" />;
      case 'AUTOMATION_SPEED':
        return <Zap className="w-4 h-4" />;
      case 'CRYSTAL_FIND':
        return <Gem className="w-4 h-4" />;
      case 'SEED_TIER_BOOST':
        return <Leaf className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Transcendence
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="gap-1.5 bg-purple-600 hover:bg-purple-700">
                <Crown className="w-3 h-3" />
                Level {transcendenceState?.transcendenceLevel || 0}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 tabular-nums">
                <Sparkles className="w-3 h-3" />
                {transcendenceState?.transcendencePoints || 0} Points
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Section */}
          <Card className="bg-secondary/50 border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Current Prestige Level</span>
                <span className="text-yellow-400 font-bold tabular-nums">{prestigeLevel}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Required Level</span>
                <span className="text-muted-foreground tabular-nums">
                  {TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL}
                </span>
              </div>

              <Progress
                value={progressPercent}
                className="h-3"
                indicatorClassName={
                  transcendenceCheck.canTranscend ? 'bg-purple-500' : 'bg-purple-300'
                }
              />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Points on Transcend</span>
                <span
                  className={`font-bold text-lg flex items-center gap-1.5 tabular-nums ${projectedPoints > 0 ? 'text-purple-400' : 'text-muted-foreground'}`}
                >
                  +{projectedPoints}
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </span>
              </div>

              <Button
                onClick={() => setShowConfirmModal(true)}
                disabled={!transcendenceCheck.canTranscend}
                size="xl"
                className={`w-full gap-2 ${
                  transcendenceCheck.canTranscend
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : ''
                }`}
                variant={transcendenceCheck.canTranscend ? 'default' : 'secondary'}
              >
                {transcendenceCheck.canTranscend ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span className="tabular-nums">
                      Transcend for {transcendenceCheck.potentialPoints} Points
                    </span>
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  transcendenceCheck.reason || 'Cannot Transcend Yet'
                )}
              </Button>

              {/* Info about what's needed */}
              {!transcendenceCheck.canTranscend && (
                <p className="text-xs text-muted-foreground text-center">
                  Reach Prestige Level {TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL} to unlock
                  Transcendence
                </p>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Transcendence Bonuses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Meta-Bonuses</CardTitle>
          <CardDescription>
            Spend transcendence points on upgrades that persist through prestige resets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bonuses.map(bonus => {
              const transcendencePoints = transcendenceState?.transcendencePoints || 0;
              const canAfford = transcendencePoints >= (bonus.nextCost || 0);
              const isMaxed = bonus.isMaxed;

              return (
                <Card
                  key={bonus.bonus.id}
                  className={`transition-all border-border/50 ${
                    isMaxed
                      ? 'border-purple-500/50 bg-purple-500/5'
                      : canAfford
                        ? 'border-purple-400/50 hover:border-purple-400 bg-purple-500/5'
                        : 'bg-secondary/30'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${isMaxed ? 'bg-purple-500/20' : 'bg-purple-600/20'}`}
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
                        className={`text-sm ${bonus.currentLevel > 0 ? 'text-purple-400' : 'text-muted-foreground'}`}
                      >
                        {bonus.currentLevel > 0 ? formatEffect(bonus) : 'Not purchased'}
                      </span>

                      {!isMaxed ? (
                        <Button
                          onClick={() => handlePurchaseBonus(bonus.bonus.id)}
                          disabled={!canAfford}
                          variant={canAfford ? 'default' : 'secondary'}
                          size="sm"
                          className={`gap-1.5 tabular-nums ${canAfford ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {bonus.nextCost}
                        </Button>
                      ) : (
                        <Badge className="gap-1.5 bg-purple-600">
                          <Crown className="w-3 h-3" />
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
                {transcendenceState?.totalTranscendencePointsEarned || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="stats-label mb-1">Spent</p>
              <p className="text-lg font-bold text-muted-foreground tabular-nums">
                {(transcendenceState?.totalTranscendencePointsEarned || 0) -
                  (transcendenceState?.transcendencePoints || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="stats-label mb-1">Available</p>
              <p className="text-lg font-bold text-purple-400 tabular-nums">
                {transcendenceState?.transcendencePoints || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <TranscendenceConfirmModal
          potentialPoints={transcendenceCheck.potentialPoints}
          newLevel={(transcendenceState?.transcendenceLevel || 0) + 1}
          currentPrestigeLevel={prestigeLevel}
          onConfirm={handleTranscend}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default TranscendencePanel;
