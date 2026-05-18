/**
 * DevToolsPanel - Professional development tools
 * Toggle with Ctrl+Shift+D
 *
 * Features:
 * - Tabbed interface for organization
 * - Live stats dashboard
 * - Quick action buttons
 * - Terminal-inspired aesthetic
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/ToastProvider';
import {
  X,
  Coins,
  Download,
  FastForward,
  Sprout,
  Globe,
  FlaskConical,
  Zap,
  Unlock,
  Eye,
  Radio,
  Circle,
  Bomb,
  Terminal,
  Cpu,
  Activity,
  Sparkles,
  ChevronRight,
  Play,
  RotateCcw,
} from 'lucide-react';
import { SEED_TIERS, RESEARCH_NODES } from '@/game';
import { useAIViewer } from '@/hooks/useAIViewer';
import { useGame } from '@/contexts/GameEngineContext';
import { cn } from '@/lib/utils';

type TabId = 'quick' | 'resources' | 'game' | 'ai' | 'danger';

const DevToolsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('quick');
  const [selectedTier, setSelectedTier] = useState<string>('1');
  const [seedCount, setSeedCount] = useState<string>('10');

  const { addToast } = useToast();
  const gameContext = useGame();
  const state = gameContext?.state ?? null;

  // Convex mutations
  const devAddCreditsMutation = useMutation(api.dev.devAddCredits);
  const devAddCrystalsMutation = useMutation(api.dev.devAddCrystals);
  const devAddSeedEssenceMutation = useMutation(api.dev.devAddSeedEssence);
  const devAddRefinedEssenceMutation = useMutation(api.dev.devAddRefinedEssence);
  const devAddPrestigePointsMutation = useMutation(api.dev.devAddPrestigePoints);
  const devSpawnSeedsMutation = useMutation(api.dev.devSpawnSeeds);
  const devUnlockAllPlanetsMutation = useMutation(api.dev.devUnlockAllPlanets);
  const devCompleteAllResearchMutation = useMutation(api.dev.devCompleteAllResearch);
  const devCompleteAllExportsMutation = useMutation(api.dev.devCompleteAllExports);
  const devSimulateTimeMutation = useMutation(api.dev.devSimulateTime);
  const devTriggerRandomEventMutation = useMutation(api.dev.devTriggerRandomEvent);
  const devSpawnAnomalyMutation = useMutation(api.dev.devSpawnAnomaly);
  const devResetMutation = useMutation(api.dev.devReset);

  // AI Viewer
  const aiViewer = useAIViewer();

  // Derived stats
  const credits = state?.ship?.totalCurrency ?? 0;
  const crystals = state?.ship?.crystals ?? 0;
  const seedEssence = Math.floor(state?.ship?.resources?.seedEssence ?? 0);
  const refinedEssence = state?.research?.refinedEssence ?? 0;
  const seedInventoryCount = state?.ship?.seedInventory?.length ?? 0;
  const planetsUnlocked =
    state?.planets?.filter((p: { unlocked?: boolean }) => p.unlocked).length ?? 0;
  const planetsTotal = state?.planets?.length ?? 0;
  const researchCompleted = state?.research?.completed?.length ?? 0;
  const researchTotal = Object.keys(RESEARCH_NODES).length;
  const prestigeLevel = state?.prestige?.prestigeLevel ?? 0;
  const prestigePoints = state?.prestige?.prestigePoints ?? 0;

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Action handlers
  const runAction = useCallback(
    async (action: () => Promise<unknown>, successMsg: string, errorMsg: string) => {
      try {
        await action();
        addToast(successMsg, 'success');
      } catch (error) {
        addToast(`${errorMsg}: ${error}`, 'error');
      }
    },
    [addToast]
  );

  const handleExport = () => {
    if (!state) {
      addToast('No game state', 'error');
      return;
    }
    navigator.clipboard.writeText(JSON.stringify(state, null, 2));
    addToast('State copied to clipboard', 'success');
  };

  const handleReset = async () => {
    await runAction(() => devResetMutation(), 'Game reset - refreshing...', 'Reset failed');
    setTimeout(() => window.location.reload(), 500);
  };

  const handleNuclearReset = async () => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    if (window.indexedDB?.databases) {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
    }
    try {
      await devResetMutation();
    } catch {
      /* ignore */
    }
    addToast('All data nuked - reloading...', 'info');
    setTimeout(() => window.location.reload(), 500);
  };

  // Only in dev mode
  if (!import.meta.env.DEV) return null;

  // Floating trigger button
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 z-[9999]',
          'w-12 h-12 rounded-xl',
          'bg-amber-500/20 hover:bg-amber-500/30',
          'border border-amber-500/50 hover:border-amber-500',
          'flex items-center justify-center',
          'shadow-lg shadow-amber-500/20',
          'transition-colors'
        )}
      >
        <Terminal className="w-5 h-5 text-amber-400" />
      </motion.button>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'quick', label: 'QUICK', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'resources', label: 'RES', icon: <Coins className="w-3.5 h-3.5" /> },
    { id: 'game', label: 'GAME', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'ai', label: 'AI', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'danger', label: 'DANGER', icon: <Bomb className="w-3.5 h-3.5" /> },
  ];

  // Quick action button component
  const QuickBtn: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
    color?: string;
    disabled?: boolean;
  }> = ({ onClick, icon, label, sublabel, color = 'cyan', disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all text-left w-full',
        'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50',
        `hover:border-${color}-500/50`,
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          `bg-${color}-500/20 text-${color}-400`
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-mono font-medium text-slate-200">{label}</div>
        {sublabel && <div className="text-xs text-slate-500 truncate">{sublabel}</div>}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
    </button>
  );

  // Resource add buttons
  const ResourceBtn: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 rounded transition-all text-cyan-400"
    >
      {label}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed bottom-4 right-4 z-[9999] w-96',
          'bg-slate-950/98 backdrop-blur-sm rounded-xl',
          'border border-amber-500/30',
          'shadow-2xl shadow-black/50',
          'overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-bold text-sm text-amber-400">DEV_TOOLS</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono">
              v2.0
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Stats Bar */}
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 grid grid-cols-5 gap-3">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-mono">CREDITS</div>
            <div className="text-sm font-mono font-bold text-amber-400 tabular-nums">
              {credits >= 1000000
                ? `${(credits / 1000000).toFixed(1)}M`
                : credits >= 1000
                  ? `${(credits / 1000).toFixed(0)}K`
                  : credits}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-mono">GEMS</div>
            <div className="text-sm font-mono font-bold text-purple-400 tabular-nums">
              {crystals}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-mono">SEEDS</div>
            <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
              {seedInventoryCount}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-mono">ESSENCE</div>
            <div className="text-sm font-mono font-bold text-blue-400 tabular-nums">
              {seedEssence >= 1000 ? `${(seedEssence / 1000).toFixed(0)}K` : seedEssence}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-mono">PRESTIGE</div>
            <div className="text-sm font-mono font-bold text-cyan-400 tabular-nums">
              Lv.{prestigeLevel}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono transition-all',
                activeTab === tab.id
                  ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="h-[420px]">
          <div className="p-3">
            {/* Quick Actions Tab */}
            {activeTab === 'quick' && (
              <div className="space-y-2">
                <QuickBtn
                  onClick={() =>
                    runAction(
                      () => devAddCreditsMutation({ amount: 1000000 }),
                      '+1M Credits',
                      'Failed'
                    )
                  }
                  icon={<Coins className="w-4 h-4" />}
                  label="+1M CREDITS"
                  sublabel="Instant money"
                  color="amber"
                />
                <QuickBtn
                  onClick={() =>
                    runAction(
                      () => devSpawnSeedsMutation({ tier: 5, count: 10 }),
                      '+10 T5 Seeds',
                      'Failed'
                    )
                  }
                  icon={<Sprout className="w-4 h-4" />}
                  label="+10 LEGENDARY SEEDS"
                  sublabel="T5 seeds to inventory"
                  color="emerald"
                />
                <QuickBtn
                  onClick={() =>
                    runAction(() => devUnlockAllPlanetsMutation(), 'All planets unlocked', 'Failed')
                  }
                  icon={<Unlock className="w-4 h-4" />}
                  label="UNLOCK ALL PLANETS"
                  sublabel={`${planetsUnlocked}/${planetsTotal} unlocked`}
                  color="cyan"
                  disabled={planetsUnlocked === planetsTotal}
                />
                <QuickBtn
                  onClick={() =>
                    runAction(() => devCompleteAllResearchMutation(), 'All research done', 'Failed')
                  }
                  icon={<FlaskConical className="w-4 h-4" />}
                  label="COMPLETE RESEARCH"
                  sublabel={`${researchCompleted}/${researchTotal} done`}
                  color="purple"
                  disabled={researchCompleted === researchTotal}
                />
                <QuickBtn
                  onClick={() =>
                    runAction(
                      () => devSimulateTimeMutation({ minutes: 60 }),
                      '+1 hour simulated',
                      'Failed'
                    )
                  }
                  icon={<FastForward className="w-4 h-4" />}
                  label="SKIP 1 HOUR"
                  sublabel="Simulate production"
                  color="blue"
                />
                <QuickBtn
                  onClick={() =>
                    runAction(() => devCompleteAllExportsMutation(), 'Exports completed', 'Failed')
                  }
                  icon={<Play className="w-4 h-4" />}
                  label="COMPLETE EXPORTS"
                  sublabel="Instant export all planets"
                  color="green"
                />
                <QuickBtn
                  onClick={() =>
                    runAction(() => devTriggerRandomEventMutation(), 'Event triggered', 'Failed')
                  }
                  icon={<Sparkles className="w-4 h-4" />}
                  label="TRIGGER EVENT"
                  sublabel="Random game event"
                  color="pink"
                />
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                {/* Credits */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">CREDITS</span>
                    <span className="text-xs font-mono text-amber-400 tabular-nums">
                      {credits.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <ResourceBtn
                      label="+10K"
                      onClick={() =>
                        runAction(() => devAddCreditsMutation({ amount: 10000 }), '+10K', 'Failed')
                      }
                    />
                    <ResourceBtn
                      label="+100K"
                      onClick={() =>
                        runAction(
                          () => devAddCreditsMutation({ amount: 100000 }),
                          '+100K',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="+1M"
                      onClick={() =>
                        runAction(() => devAddCreditsMutation({ amount: 1000000 }), '+1M', 'Failed')
                      }
                    />
                    <ResourceBtn
                      label="+10M"
                      onClick={() =>
                        runAction(
                          () => devAddCreditsMutation({ amount: 10000000 }),
                          '+10M',
                          'Failed'
                        )
                      }
                    />
                  </div>
                </div>

                {/* Crystals */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">CRYSTALS</span>
                    <span className="text-xs font-mono text-purple-400 tabular-nums">
                      {crystals.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <ResourceBtn
                      label="+100"
                      onClick={() =>
                        runAction(() => devAddCrystalsMutation({ amount: 100 }), '+100', 'Failed')
                      }
                    />
                    <ResourceBtn
                      label="+1K"
                      onClick={() =>
                        runAction(() => devAddCrystalsMutation({ amount: 1000 }), '+1K', 'Failed')
                      }
                    />
                    <ResourceBtn
                      label="+10K"
                      onClick={() =>
                        runAction(() => devAddCrystalsMutation({ amount: 10000 }), '+10K', 'Failed')
                      }
                    />
                  </div>
                </div>

                {/* Seed Essence */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">SEED ESSENCE</span>
                    <span className="text-xs font-mono text-blue-400 tabular-nums">
                      {seedEssence.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <ResourceBtn
                      label="+1K"
                      onClick={() =>
                        runAction(
                          () => devAddSeedEssenceMutation({ amount: 1000 }),
                          '+1K',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="+10K"
                      onClick={() =>
                        runAction(
                          () => devAddSeedEssenceMutation({ amount: 10000 }),
                          '+10K',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="+100K"
                      onClick={() =>
                        runAction(
                          () => devAddSeedEssenceMutation({ amount: 100000 }),
                          '+100K',
                          'Failed'
                        )
                      }
                    />
                  </div>
                </div>

                {/* Refined Essence */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">REFINED ESSENCE</span>
                    <span className="text-xs font-mono text-teal-400 tabular-nums">
                      {refinedEssence.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <ResourceBtn
                      label="+100"
                      onClick={() =>
                        runAction(
                          () => devAddRefinedEssenceMutation({ amount: 100 }),
                          '+100',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="+1K"
                      onClick={() =>
                        runAction(
                          () => devAddRefinedEssenceMutation({ amount: 1000 }),
                          '+1K',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="+10K"
                      onClick={() =>
                        runAction(
                          () => devAddRefinedEssenceMutation({ amount: 10000 }),
                          '+10K',
                          'Failed'
                        )
                      }
                    />
                  </div>
                </div>

                {/* Prestige Points */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">PRESTIGE POINTS</span>
                    <span className="text-xs font-mono text-cyan-400 tabular-nums">
                      {prestigePoints.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <ResourceBtn
                      label="+10"
                      onClick={() =>
                        runAction(
                          () => devAddPrestigePointsMutation({ amount: 10 }),
                          '+10',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="+100"
                      onClick={() =>
                        runAction(
                          () => devAddPrestigePointsMutation({ amount: 100 }),
                          '+100',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="+1K"
                      onClick={() =>
                        runAction(
                          () => devAddPrestigePointsMutation({ amount: 1000 }),
                          '+1K',
                          'Failed'
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Game Tab */}
            {activeTab === 'game' && (
              <div className="space-y-4">
                {/* Seed Spawner */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Spawn Seeds</div>
                  <div className="flex gap-2">
                    <Select value={selectedTier} onValueChange={setSelectedTier}>
                      <SelectTrigger className="h-8 text-xs w-20 bg-slate-900 border-slate-700 hover:border-amber-500/50 font-mono text-amber-400 focus:ring-amber-500/30 focus:ring-offset-slate-950">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 shadow-xl shadow-black/50">
                        {Object.keys(SEED_TIERS).map(tier => (
                          <SelectItem
                            key={tier}
                            value={tier}
                            className="font-mono text-xs text-slate-300 focus:bg-amber-500/20 focus:text-amber-400 cursor-pointer"
                          >
                            T{tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={seedCount} onValueChange={setSeedCount}>
                      <SelectTrigger className="h-8 text-xs w-20 bg-slate-900 border-slate-700 hover:border-amber-500/50 font-mono text-amber-400 focus:ring-amber-500/30 focus:ring-offset-slate-950">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 shadow-xl shadow-black/50">
                        {['1', '5', '10', '25', '50', '100'].map(n => (
                          <SelectItem
                            key={n}
                            value={n}
                            className="font-mono text-xs text-slate-300 focus:bg-amber-500/20 focus:text-amber-400 cursor-pointer"
                          >
                            x{n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs font-mono bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                      onClick={() =>
                        runAction(
                          () =>
                            devSpawnSeedsMutation({
                              tier: parseInt(selectedTier),
                              count: parseInt(seedCount),
                            }),
                          `+${seedCount} T${selectedTier} seeds`,
                          'Failed'
                        )
                      }
                    >
                      <Sprout className="w-3 h-3 mr-1" />
                      SPAWN
                    </Button>
                  </div>
                </div>

                {/* Time Controls */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">
                    Time Simulation
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <ResourceBtn
                      label="+1m"
                      onClick={() =>
                        runAction(() => devSimulateTimeMutation({ minutes: 1 }), '+1min', 'Failed')
                      }
                    />
                    <ResourceBtn
                      label="+10m"
                      onClick={() =>
                        runAction(
                          () => devSimulateTimeMutation({ minutes: 10 }),
                          '+10min',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="+1h"
                      onClick={() =>
                        runAction(() => devSimulateTimeMutation({ minutes: 60 }), '+1hr', 'Failed')
                      }
                    />
                    <ResourceBtn
                      label="+8h"
                      onClick={() =>
                        runAction(() => devSimulateTimeMutation({ minutes: 480 }), '+8hr', 'Failed')
                      }
                    />
                  </div>
                </div>

                {/* Anomaly Spawner */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">
                    Spawn Anomaly
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <ResourceBtn
                      label="Random"
                      onClick={() =>
                        runAction(() => devSpawnAnomalyMutation({}), 'Anomaly!', 'Failed')
                      }
                    />
                    <ResourceBtn
                      label="Credit"
                      onClick={() =>
                        runAction(
                          () => devSpawnAnomalyMutation({ anomalyType: 'CREDIT_BURST' }),
                          'Credit anomaly!',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="Lucky"
                      onClick={() =>
                        runAction(
                          () => devSpawnAnomalyMutation({ anomalyType: 'LUCKY_STAR' }),
                          'Lucky star!',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="Crystal"
                      onClick={() =>
                        runAction(
                          () => devSpawnAnomalyMutation({ anomalyType: 'COSMIC_SHARD' }),
                          'Crystal anomaly!',
                          'Failed'
                        )
                      }
                    />
                    <ResourceBtn
                      label="Seed"
                      onClick={() =>
                        runAction(
                          () => devSpawnAnomalyMutation({ anomalyType: 'SEED_RAIN' }),
                          'Seed rain!',
                          'Failed'
                        )
                      }
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-1 p-2 bg-slate-800/50 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-500 uppercase mb-2">
                    Game Stats
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Planets</span>
                      <span className="text-slate-300">
                        {planetsUnlocked}/{planetsTotal}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Research</span>
                      <span className="text-slate-300">
                        {researchCompleted}/{researchTotal}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Prestige</span>
                      <span className="text-slate-300">Lv.{prestigeLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Seeds</span>
                      <span className="text-slate-300">{seedInventoryCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-3">
                {/* Connection Status */}
                <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                  <Circle
                    className={cn('w-2.5 h-2.5', {
                      'fill-green-400 text-green-400': aiViewer.status === 'connected',
                      'fill-yellow-400 text-yellow-400 animate-pulse':
                        aiViewer.status === 'connecting',
                      'fill-red-400 text-red-400': aiViewer.status === 'error',
                      'fill-slate-500 text-slate-500': aiViewer.status === 'disconnected',
                    })}
                  />
                  <span className="text-xs font-mono text-slate-300 capitalize flex-1">
                    {aiViewer.status}
                  </span>
                  {aiViewer.status === 'disconnected' || aiViewer.status === 'error' ? (
                    <Button
                      size="sm"
                      className="h-6 text-[10px] font-mono bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
                      onClick={() => {
                        aiViewer.reconnect();
                        addToast('Connecting...', 'info');
                      }}
                    >
                      <Radio className="w-3 h-3 mr-1" />
                      CONNECT
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] font-mono text-slate-500"
                      onClick={() => aiViewer.reconnect()}
                    >
                      Disconnect
                    </Button>
                  )}
                </div>

                {aiViewer.error && (
                  <div className="text-[10px] text-red-400 font-mono p-2 bg-red-500/10 rounded">
                    {aiViewer.error}
                  </div>
                )}

                {/* AI State */}
                {aiViewer.connected && aiViewer.state && (
                  <div className="p-2 bg-slate-800/50 rounded-lg space-y-1">
                    <div className="text-[10px] font-mono text-green-400 uppercase mb-2 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      AI Game State
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Credits</span>
                        <span className="text-slate-300">
                          {aiViewer.state.ship.totalCurrency.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Crystals</span>
                        <span className="text-slate-300">{aiViewer.state.ship.crystals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Seeds</span>
                        <span className="text-slate-300">
                          {aiViewer.state.ship.seedInventory.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Planets</span>
                        <span className="text-slate-300">
                          {
                            aiViewer.state.planets.filter((p: { unlocked: boolean }) => p.unlocked)
                              .length
                          }
                          /{aiViewer.state.planets.length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Log */}
                {aiViewer.connected && aiViewer.actionLog.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        Action Log
                      </span>
                      <button
                        onClick={() => aiViewer.clearLog()}
                        className="text-[9px] font-mono text-slate-500 hover:text-slate-300"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {aiViewer.actionLog
                        .slice()
                        .reverse()
                        .slice(0, 20)
                        .map((entry, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 bg-slate-800/30 rounded text-[9px] font-mono"
                          >
                            <div className="flex justify-between text-blue-400">
                              <span>{entry.action}</span>
                              <span className="text-slate-600">{entry.time}s</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="text-[9px] font-mono text-slate-600 p-2 bg-slate-800/30 rounded">
                  <Cpu className="w-3 h-3 inline mr-1" />
                  Run: <code className="text-cyan-400">npm run mcp:server</code>
                </div>
              </div>
            )}

            {/* Danger Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-3">
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="text-xs font-mono text-red-400 font-bold mb-2">DANGER ZONE</div>
                  <p className="text-[10px] text-red-400/70 mb-3">
                    These actions cannot be undone. Use with caution.
                  </p>

                  <div className="space-y-2">
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      onClick={handleExport}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      EXPORT STATE TO CLIPBOARD
                    </Button>

                    <Button
                      size="sm"
                      className="w-full h-8 text-xs font-mono bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      RESET GAME (Keep Account)
                    </Button>

                    <Button
                      size="sm"
                      className="w-full h-8 text-xs font-mono bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                      onClick={handleNuclearReset}
                    >
                      <Bomb className="w-3 h-3 mr-1" />
                      NUCLEAR RESET (Delete Everything)
                    </Button>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-slate-600 text-center">
                  Press <kbd className="px-1 py-0.5 bg-slate-800 rounded">Ctrl+Shift+D</kbd> to
                  toggle
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
};

export default memo(DevToolsPanel);
