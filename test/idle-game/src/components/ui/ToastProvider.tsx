/**
 * Toast Notification System
 * Provides visual feedback for game events
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { eventBus } from '../../game/core/EventBus';
import { Card } from './card';
import { Check, X, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { SEED_TYPES } from '../../game/config/seeds';
import { getTierName } from '../../game/systems/GachaSystem';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'discovery';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-950/80',
    border: 'border-green-500/50',
    icon: <Check className="w-4 h-4 text-green-400" />,
  },
  error: {
    bg: 'bg-red-950/80',
    border: 'border-red-500/50',
    icon: <X className="w-4 h-4 text-red-400" />,
  },
  info: {
    bg: 'bg-blue-950/80',
    border: 'border-blue-500/50',
    icon: <Info className="w-4 h-4 text-blue-400" />,
  },
  warning: {
    bg: 'bg-yellow-950/80',
    border: 'border-yellow-500/50',
    icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  },
  discovery: {
    bg: 'bg-purple-950/80',
    border: 'border-purple-500/50',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
  },
};

interface ToastProviderProps {
  children: React.ReactNode;
}

// Max toasts to prevent UI overflow
const MAX_TOASTS = 5;

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRefs = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const refs = timeoutRefs.current;
    return () => {
      refs.forEach(timeout => clearTimeout(timeout));
      refs.clear();
    };
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const newToast: Toast = { id, message, type, duration };

    setToasts(prev => {
      // Limit max toasts, remove oldest if exceeding
      const updated = [...prev, newToast];
      if (updated.length > MAX_TOASTS) {
        const removed = updated.shift();
        if (removed) {
          const timeout = timeoutRefs.current.get(removed.id);
          if (timeout) {
            clearTimeout(timeout);
            timeoutRefs.current.delete(removed.id);
          }
        }
      }
      return updated;
    });

    if (duration > 0) {
      const timeout = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        timeoutRefs.current.delete(id);
      }, duration);
      timeoutRefs.current.set(id, timeout);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  // Subscribe to game events for automatic toasts
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Achievement unlocked
    unsubscribers.push(
      eventBus.on('achievementUnlocked', event => {
        const data = event.payload as {
          achievementId: string;
          name: string;
          description: string;
          reward: { type: string; amount: number };
        };
        addToast(`Achievement Unlocked: ${data.name}!`, 'success', 5000);
      })
    );

    // Achievement claimed
    unsubscribers.push(
      eventBus.on('achievementClaimed', event => {
        const data = event.payload as {
          achievementId: string;
          reward: { type: string; amount: number };
        };
        addToast(`Claimed ${data.reward.amount} ${data.reward.type}!`, 'info', 3000);
      })
    );

    // Research unlocked
    unsubscribers.push(
      eventBus.on('researchUnlocked', event => {
        const data = event.payload as { researchId: string; name?: string };
        addToast(`Research Complete: ${data.name || data.researchId}`, 'success', 4000);
      })
    );

    // Plants refined
    unsubscribers.push(
      eventBus.on('plantsRefined', event => {
        const data = event.payload as {
          plantType: string;
          plantsUsed?: number;
          essenceGained?: number;
        };
        addToast(
          `Refined ${data.plantsUsed} ${data.plantType} → ${data.essenceGained} essence`,
          'info',
          2500
        );
      })
    );

    // All plants refined
    unsubscribers.push(
      eventBus.on('allPlantsRefined', event => {
        const data = event.payload as { totalRefinedEssence: number };
        if (data.totalRefinedEssence > 0) {
          addToast(`Refined all plants → ${data.totalRefinedEssence} essence`, 'success', 3000);
        }
      })
    );

    // Seed fused
    unsubscribers.push(
      eventBus.on('seedFused', event => {
        const data = event.payload as { seed?: { name: string; tier: number } };
        if (data.seed) {
          addToast(`Fusion Success! Created ${data.seed.name}`, 'success', 3500);
        }
      })
    );

    // Planet upgraded
    unsubscribers.push(
      eventBus.on('planetUpgraded', event => {
        const data = event.payload as { planetIndex: number; upgradeType: string };
        addToast(
          `Planet upgraded: ${data.upgradeType.replace(/_/g, ' ').toLowerCase()}`,
          'success',
          2500
        );
      })
    );

    // Planet unlocked
    unsubscribers.push(
      eventBus.on('planetUnlocked', event => {
        const data = event.payload as { planetId: string; name: string };
        addToast(`New planet unlocked: ${data.name}!`, 'success', 4000);
      })
    );

    // Seedex: Batched discovery notifications
    // Collects discoveries over 500ms window to prevent toast spam on multi-pulls
    let discoveryBatch: { seedId: string; tier: number; isNew: boolean }[] = [];
    let discoveryTimeout: ReturnType<typeof setTimeout> | null = null;

    const flushDiscoveryBatch = () => {
      if (discoveryBatch.length === 0) return;

      const newSeeds = discoveryBatch.filter(d => d.isNew);
      const newTiers = discoveryBatch.filter(d => !d.isNew && d.tier >= 3);

      if (newSeeds.length === 1) {
        // Single new seed - show detailed message
        const d = newSeeds[0];
        const seedDef = SEED_TYPES[d.seedId];
        const seedName = seedDef?.name || d.seedId;
        const tierName = getTierName(d.tier);
        addToast(`New discovery! ${seedName} (${tierName})`, 'discovery', 4000);
      } else if (newSeeds.length > 1) {
        // Multiple new seeds - batch message
        addToast(`Discovered ${newSeeds.length} new seeds!`, 'discovery', 4000);
      }

      // Show rare+ tier discoveries (max 1 toast)
      if (newTiers.length === 1) {
        const d = newTiers[0];
        const seedDef = SEED_TYPES[d.seedId];
        const seedName = seedDef?.name || d.seedId;
        const tierName = getTierName(d.tier);
        addToast(`${tierName} ${seedName} discovered!`, 'discovery', 3000);
      } else if (newTiers.length > 1) {
        addToast(`Discovered ${newTiers.length} rare+ seeds!`, 'discovery', 3000);
      }

      discoveryBatch = [];
      discoveryTimeout = null;
    };

    // New seed discovered
    unsubscribers.push(
      eventBus.on('seedexNewSeed', event => {
        const data = event.payload as { seedId: string; tier: number };
        discoveryBatch.push({ ...data, isNew: true });
        if (!discoveryTimeout) {
          discoveryTimeout = setTimeout(flushDiscoveryBatch, 500);
        }
      })
    );

    // New tier discovered for existing seed
    unsubscribers.push(
      eventBus.on('seedexNewTier', event => {
        const data = event.payload as { seedId: string; tier: number };
        // Only track rare+ tiers
        if (data.tier >= 3) {
          discoveryBatch.push({ ...data, isNew: false });
          if (!discoveryTimeout) {
            discoveryTimeout = setTimeout(flushDiscoveryBatch, 500);
          }
        }
      })
    );

    // Cleanup discovery timeout on unmount
    const cleanupDiscoveryTimeout = () => {
      if (discoveryTimeout) {
        clearTimeout(discoveryTimeout);
        discoveryTimeout = null;
      }
    };

    // Seedex: Reward claimed
    unsubscribers.push(
      eventBus.on('seedexRewardClaimed', event => {
        const data = event.payload as {
          rewardId: string;
          credits: number;
          crystals: number;
          essence: number;
        };
        const rewards: string[] = [];
        if (data.credits > 0) rewards.push(`${data.credits} credits`);
        if (data.crystals > 0) rewards.push(`${data.crystals} crystals`);
        if (data.essence > 0) rewards.push(`${data.essence} essence`);
        if (rewards.length > 0) {
          addToast(`Seedex reward: ${rewards.join(', ')}`, 'success', 3000);
        }
      })
    );

    // Resources sold - feedback toast
    unsubscribers.push(
      eventBus.on('resourcesSold', event => {
        const data = event.payload as {
          plantType: string;
          amount: number;
          revenue: number;
          essenceBonus: number;
        };
        const plural = data.amount === 1 ? '' : 's';
        if (data.plantType === 'all') {
          addToast(
            `Sold ${data.amount} plant${plural} for ${data.revenue} credits!`,
            'success',
            2500
          );
        } else {
          const seedDef = SEED_TYPES[data.plantType];
          const plantName = seedDef?.name?.replace(' Seeds', '') || data.plantType;
          addToast(
            `Sold ${data.amount} ${plantName} for ${data.revenue} credits!`,
            'success',
            2500
          );
        }
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
      cleanupDiscoveryTimeout();
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}

      {/* Toast Container - pointer-events-none on container, auto on toasts */}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      >
        {toasts.map(toast => {
          const style = TOAST_STYLES[toast.type];
          return (
            <Card
              key={toast.id}
              className={`
                ${style.bg} ${style.border}
                border shadow-lg backdrop-blur-sm
                animate-slide-in
                cursor-pointer
                hover:opacity-90 transition-all
                pointer-events-auto
              `}
              onClick={() => removeToast(toast.id)}
            >
              <div className="flex items-center gap-3 p-3">
                <div className="shrink-0">{style.icon}</div>
                <span className="text-foreground text-sm">{toast.message}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
