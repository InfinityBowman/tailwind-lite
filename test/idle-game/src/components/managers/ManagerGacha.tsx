/**
 * Manager Gacha Component
 * Pull UI for the manager gacha system
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import {
  MANAGER_GACHA_CONFIG,
  MANAGER_RARITY_CONFIG,
  MANAGER_TEMPLATES,
} from '../../game/config/managers';
import type { ManagerPullResult, ManagerState } from '../../game/systems/ManagerSystem';
import { canAffordPull } from '../../game/systems/ManagerSystem';
import { useReducedMotion } from '../../hooks';
import { getManagerIcon, Sparkles, HelpCircle } from './managerIcons';
import { Gem, UserPlus, Users, FastForward } from 'lucide-react';

interface ManagerGachaProps {
  managerState: ManagerState;
  crystals: number; // From ship.crystals
  onPull: () => Promise<ManagerPullResult | null> | ManagerPullResult | null;
  onMultiPull: () => Promise<ManagerPullResult[] | null> | ManagerPullResult[] | null;
}

const ManagerGacha: React.FC<ManagerGachaProps> = ({
  managerState,
  crystals,
  onPull,
  onMultiPull,
}) => {
  const [pullResults, setPullResults] = useState<ManagerPullResult[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealIndex, setRevealIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  const singleCost = MANAGER_GACHA_CONFIG.PULL_COST;
  const multiCost = Math.floor(singleCost * 10 * MANAGER_GACHA_CONFIG.MULTI_PULL_DISCOUNT);

  const canSinglePull = canAffordPull(crystals, 1);
  const canMultiPull = canAffordPull(crystals, 10);

  const handleSinglePull = useCallback(async () => {
    const result = await onPull();
    if (result) {
      // Clear any existing timeouts
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current.length = 0;

      setPullResults([result]);
      setRevealIndex(0);

      if (!prefersReducedMotion) {
        setIsRevealing(true);
        const t1 = setTimeout(() => {
          setRevealIndex(1);
          const t2 = setTimeout(() => setIsRevealing(false), 500);
          timeoutsRef.current.push(t2);
        }, 300);
        timeoutsRef.current.push(t1);
      } else {
        setRevealIndex(1);
      }
    }
  }, [onPull, prefersReducedMotion]);

  const handleMultiPull = useCallback(async () => {
    const results = await onMultiPull();
    if (results) {
      // Clear any existing timeouts
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current.length = 0;

      setPullResults(results);
      setRevealIndex(0);

      if (!prefersReducedMotion) {
        setIsRevealing(true);
        // Reveal one by one
        results.forEach((_, i) => {
          const t = setTimeout(() => setRevealIndex(i + 1), 200 * (i + 1));
          timeoutsRef.current.push(t);
        });
        const finalT = setTimeout(() => setIsRevealing(false), 200 * results.length + 500);
        timeoutsRef.current.push(finalT);
      } else {
        setRevealIndex(results.length);
      }
    }
  }, [onMultiPull, prefersReducedMotion]);

  const clearResults = () => {
    setPullResults([]);
    setRevealIndex(0);
  };

  const skipAnimation = useCallback(() => {
    // Clear all pending reveal timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.length = 0;
    // Reveal all results immediately
    setRevealIndex(pullResults.length);
    setIsRevealing(false);
  }, [pullResults.length]);

  // Calculate pity info
  const pullsSinceEpic = managerState.pullCount - managerState.lastEpicPull;
  const pullsSinceLegendary = managerState.pullCount - managerState.lastLegendaryPull;
  const epicPity = MANAGER_GACHA_CONFIG.PITY.epic - pullsSinceEpic;
  const legendaryPity = MANAGER_GACHA_CONFIG.PITY.legendary - pullsSinceLegendary;

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Manager Recruitment</h2>
        <p className="text-slate-400">Recruit new managers to boost your planets!</p>
      </div>

      {/* Crystal balance */}
      <div
        className="flex items-center gap-3 px-4 py-2 bg-purple-500/20 rounded-lg"
        role="status"
        aria-label={`${crystals.toLocaleString()} crystals available`}
      >
        <Gem className="w-6 h-6 text-purple-400" aria-hidden="true" />
        <span className="text-xl font-bold text-white">{crystals.toLocaleString()}</span>
        <span className="text-purple-400">Crystals</span>
      </div>

      {/* Pull buttons */}
      <div className="flex gap-4">
        <PullButton
          onClick={handleSinglePull}
          disabled={!canSinglePull || isRevealing}
          cost={singleCost}
          label="Single Pull"
          icon={<UserPlus className="w-6 h-6" aria-hidden="true" />}
        />

        <PullButton
          onClick={handleMultiPull}
          disabled={!canMultiPull || isRevealing}
          cost={multiCost}
          label="10 Pull"
          icon={<Users className="w-6 h-6" aria-hidden="true" />}
          highlight
        />
      </div>

      {/* Pity counters */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: MANAGER_RARITY_CONFIG.epic.color }}
            aria-hidden="true"
          />
          <span className="text-slate-400">Epic in {Math.max(0, epicPity)} pulls</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: MANAGER_RARITY_CONFIG.legendary.color }}
            aria-hidden="true"
          />
          <span className="text-slate-400">Legendary in {Math.max(0, legendaryPity)} pulls</span>
        </div>
      </div>

      {/* Drop rates */}
      <div className="text-xs text-slate-500 text-center">
        Drop rates: Common 60% | Uncommon 25% | Rare 10% | Epic 4% | Legendary 1%
      </div>

      {/* Results display */}
      {pullResults.length > 0 && (
        <div className="mt-4 w-full" aria-live="polite" aria-label="Pull results">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">Results</h3>
            <div className="flex items-center gap-3">
              {isRevealing && (
                <button
                  onClick={skipAnimation}
                  aria-label="Skip reveal animation"
                  className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <FastForward className="w-4 h-4" aria-hidden="true" />
                  Skip
                </button>
              )}
              <button
                onClick={clearResults}
                aria-label="Clear pull results"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
            role="list"
            aria-label="Pulled managers"
          >
            {pullResults.map((result, index) => (
              <PullResultCard
                key={`${result.manager.instanceId}-${index}`}
                result={result}
                revealed={index < revealIndex || !isRevealing}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PullButtonProps {
  onClick: () => void;
  disabled: boolean;
  cost: number;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

const PullButton: React.FC<PullButtonProps> = ({
  onClick,
  disabled,
  cost,
  label,
  icon,
  highlight = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={`${label}, costs ${cost.toLocaleString()} crystals${disabled ? ', cannot afford' : ''}`}
    className={cn(
      'flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      highlight
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
        : 'bg-purple-600/50 hover:bg-purple-600/70',
      !disabled && 'hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30'
    )}
  >
    {icon}
    <span className="font-bold text-white">{label}</span>
    <div className="flex items-center gap-1 text-sm text-purple-200">
      <Gem className="w-4 h-4" aria-hidden="true" />
      <span>{cost.toLocaleString()}</span>
    </div>
  </button>
);

interface PullResultCardProps {
  result: ManagerPullResult;
  revealed: boolean;
  prefersReducedMotion: boolean;
}

const PullResultCard: React.FC<PullResultCardProps> = ({
  result,
  revealed,
  prefersReducedMotion,
}) => {
  const template = MANAGER_TEMPLATES[result.template.id];
  if (!template) return null;

  const rarityConfig = MANAGER_RARITY_CONFIG[template.rarity];

  // Get the icon component from our explicit mapping
  const IconComponent = getManagerIcon(template.icon);

  // Build accessible label
  const statusLabel = result.isNew
    ? 'New manager'
    : result.leveledUp
      ? `Leveled up to ${result.newLevel}`
      : 'Duplicate';
  const ariaLabel = `${template.name}, ${template.rarity} rarity, ${statusLabel}${
    result.isAwakened ? ', awakened' : ''
  }`;

  if (!revealed) {
    return (
      <div
        role="listitem"
        aria-label="Revealing manager..."
        className="aspect-square bg-slate-700 rounded-lg flex items-center justify-center animate-pulse"
      >
        <HelpCircle className="w-8 h-8 text-slate-500" />
      </div>
    );
  }

  return (
    <div
      role="listitem"
      aria-label={ariaLabel}
      className={cn(
        'aspect-square rounded-lg flex flex-col items-center justify-center p-2 border-2 transition-all',
        !prefersReducedMotion && 'animate-fadeIn',
        result.isNew && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900'
      )}
      style={{
        backgroundColor: `${rarityConfig.color}20`,
        borderColor: rarityConfig.color,
      }}
    >
      <div
        className="p-2 rounded-full mb-1"
        style={{ backgroundColor: `${rarityConfig.color}30`, color: rarityConfig.color }}
      >
        <IconComponent className="w-6 h-6" />
      </div>

      <span className="text-xs font-medium text-center text-white truncate w-full">
        {template.name}
      </span>

      {result.isNew ? (
        <span className="text-[10px] text-yellow-400 font-bold">NEW!</span>
      ) : result.leveledUp ? (
        <span className="text-[10px] text-green-400">Lv.{result.newLevel}</span>
      ) : null}

      {result.isAwakened && (
        <Sparkles className="w-4 h-4 text-yellow-400 mt-1" aria-hidden="true" />
      )}
    </div>
  );
};

export default ManagerGacha;
