/**
 * GettingStarted - Terminal-styled progress checklist for new players
 *
 * Retro-terminal aesthetic matching the game's design language.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GlowProgress } from '@/components/ui/GamePanel';
import { Check, Terminal, Sparkles, Leaf, Package, TrendingUp, FlaskRound, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface GettingStartedProps {
  items: ChecklistItem[];
  onDismiss: () => void;
  className?: string;
}

const GettingStarted: React.FC<GettingStartedProps> = ({ items, onDismiss, className }) => {
  const completedCount = items.filter(i => i.completed).length;
  const allComplete = completedCount === items.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'relative overflow-hidden rounded-xl max-w-sm',
        'bg-slate-900/90 backdrop-blur-sm',
        'border border-cyan-500/30',
        className
      )}
      style={{
        boxShadow: '0 0 20px rgba(34, 211, 238, 0.1), inset 0 1px 0 rgba(34, 211, 238, 0.1)',
      }}
      role="region"
      aria-label={`Quick Start checklist: ${completedCount} of ${items.length} completed`}
    >
      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Header */}
      <div className="relative border-b border-slate-700/50 px-4 py-3 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Terminal className="w-3 h-3 text-cyan-400" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">
              INIT_SEQUENCE
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
            onClick={onDismiss}
            aria-label="Dismiss Quick Start checklist"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500 uppercase">PROGRESS</span>
            <span className="text-cyan-400 tabular-nums">
              [{completedCount}/{items.length}]
            </span>
          </div>
          <GlowProgress
            value={completedCount}
            max={items.length}
            color="rgb(34 211 238)"
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative p-3">
        <div className="space-y-1">
          {items.map((item, index) => (
            <ChecklistRow key={item.id} item={item} index={index} />
          ))}
        </div>

        {allComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 pt-3 border-t border-slate-700/50"
          >
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full h-8 text-xs font-mono',
                'bg-emerald-500/10 hover:bg-emerald-500/20',
                'text-emerald-400 hover:text-emerald-300',
                'border border-emerald-500/30'
              )}
              onClick={onDismiss}
            >
              <Check className="w-3 h-3 mr-2" />
              SEQUENCE_COMPLETE - DISMISS
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const ChecklistRow: React.FC<{ item: ChecklistItem; index: number }> = ({ item, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className={cn(
      'flex items-center gap-3 py-2 px-2 rounded-lg transition-all',
      'hover:bg-slate-800/50',
      item.completed ? 'opacity-60' : ''
    )}
  >
    {/* Status indicator */}
    <div
      className={cn(
        'shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all',
        item.completed
          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
          : 'bg-slate-800 border border-slate-600/50 text-slate-500'
      )}
    >
      {item.completed ? (
        <Check className="w-3 h-3" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500/50" />
      )}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <p
        className={cn(
          'text-xs font-mono',
          item.completed ? 'text-slate-500 line-through' : 'text-slate-200'
        )}
      >
        {item.title}
      </p>
    </div>

    {/* Icon */}
    <div
      className={cn(
        'shrink-0 w-6 h-6 rounded flex items-center justify-center',
        item.completed
          ? 'text-emerald-500/50'
          : 'text-cyan-400/70 bg-cyan-500/5 border border-cyan-500/10'
      )}
    >
      {React.isValidElement<{ className?: string }>(item.icon)
        ? React.cloneElement(item.icon, { className: 'w-3 h-3' })
        : item.icon}
    </div>
  </motion.div>
);

// Helper to create checklist from game state
export function createChecklistItems(state: {
  seedInventory: unknown[];
  planets: Array<{ seeds?: unknown[] }>;
  ship: { resources: { plants: Record<string, number> } };
  prestige: { lifetimeCredits: number };
  achievements?: { stats?: { totalGachaPulls?: number; totalSeedsFused?: number } };
}): ChecklistItem[] {
  // Use lifetime stats when available - prevents progress from reverting
  // when seeds are planted or fused seeds are used
  const stats = state.achievements?.stats;
  const hasSeeds = stats?.totalGachaPulls
    ? stats.totalGachaPulls > 0
    : state.seedInventory.length > 0;

  // Check both current planet seeds AND lifetime pulls > current inventory
  // (if you've pulled more than you have, some must have been planted)
  const totalCurrentSeeds =
    state.seedInventory.length + state.planets.reduce((sum, p) => sum + (p.seeds?.length || 0), 0);
  const hasPlantedSeeds =
    state.planets.some(p => p.seeds && p.seeds.length > 0) ||
    Boolean(stats?.totalGachaPulls && totalCurrentSeeds < stats.totalGachaPulls);

  // Use lifetimeCredits > 0 instead of current plant count - once you've earned any credits,
  // you've collected a harvest (checking current plants fails when you sell them)
  const hasCollectedHarvest = state.prestige.lifetimeCredits > 0;
  const hasEarnedCredits = state.prestige.lifetimeCredits > 100;

  // Use lifetime fused count when available
  const hasFused = stats?.totalSeedsFused
    ? stats.totalSeedsFused > 0
    : state.seedInventory.some(s => {
        const seed = s as { tier?: number };
        return typeof seed.tier === 'number' && seed.tier >= 2;
      });

  return [
    {
      id: 'pull',
      title: 'Pull your first seed',
      description: 'Use the Gacha to get seeds',
      icon: <Sparkles className="w-4 h-4" />,
      completed: hasSeeds,
    },
    {
      id: 'plant',
      title: 'Plant a seed',
      description: 'Add a seed to a planet',
      icon: <Leaf className="w-4 h-4" />,
      completed: hasPlantedSeeds,
    },
    {
      id: 'harvest',
      title: 'Collect your first harvest',
      description: 'Wait for plants to export',
      icon: <Package className="w-4 h-4" />,
      completed: hasCollectedHarvest,
    },
    {
      id: 'earn',
      title: 'Earn 100 credits',
      description: 'Sell plants to earn credits',
      icon: <TrendingUp className="w-4 h-4" />,
      completed: hasEarnedCredits,
    },
    {
      id: 'fuse',
      title: 'Fuse two seeds',
      description: 'Combine seeds for higher tiers',
      icon: <FlaskRound className="w-4 h-4" />,
      completed: hasFused,
    },
  ];
}

export default GettingStarted;
