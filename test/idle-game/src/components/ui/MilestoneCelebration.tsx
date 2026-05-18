/**
 * Milestone Celebration
 * Shows a dramatic full-screen celebration for major achievements
 *
 * Accessibility:
 * - Respects prefers-reduced-motion preference
 * - Can be dismissed with click or ESC key
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { eventBus } from '../../game/core/EventBus';
import { useReducedMotion } from '../../hooks';
import { Trophy, Star, Sparkles, Rocket, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Animation timing constants
const DISPLAY_DURATION_MS = 3000;
const FADE_DURATION_MS = 500;
const PARTICLE_COUNT = 12;
const REDUCED_MOTION_DURATION_MS = 2000;

interface MilestoneData {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
}

const MILESTONE_ICONS = {
  planet: <Rocket className="w-16 h-16" />,
  prestige: <Crown className="w-16 h-16" />,
  legendary: <Star className="w-16 h-16" />,
  achievement: <Trophy className="w-16 h-16" />,
};

const MilestoneCelebration: React.FC = () => {
  const [milestone, setMilestone] = useState<MilestoneData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    setTimeout(() => {
      setMilestone(null);
      isActiveRef.current = false;
      // Restore focus to previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }, FADE_DURATION_MS);
  }, []);

  const showCelebration = useCallback(
    (data: MilestoneData) => {
      // Ignore new celebrations while one is active (prevents jarring resets)
      if (isActiveRef.current) return;
      isActiveRef.current = true;

      // Save current focus to restore later
      previousFocusRef.current = document.activeElement as HTMLElement;

      setMilestone(data);
      setIsVisible(true);

      // Shorter duration for reduced motion users
      const duration = prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : DISPLAY_DURATION_MS;

      // Auto-hide after animation
      timeoutRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    },
    [prefersReducedMotion, dismiss]
  );

  // Focus management - move focus to dialog when visible
  useEffect(() => {
    if (isVisible && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isVisible]);

  // Keyboard dismiss (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, dismiss]);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Planet unlocked - celebrate new planets
    unsubscribers.push(
      eventBus.on('planetUnlocked', event => {
        const data = event.payload as { planetId: string; name: string };
        showCelebration({
          id: `planet-${Date.now()}`,
          icon: MILESTONE_ICONS.planet,
          title: 'New Planet Unlocked!',
          subtitle: data.name,
          color: 'from-blue-500 to-cyan-500',
        });
      })
    );

    // Prestige - major milestone
    unsubscribers.push(
      eventBus.on('prestiged', event => {
        const data = event.payload as { newLevel: number; pointsGained: number };
        showCelebration({
          id: `prestige-${Date.now()}`,
          icon: MILESTONE_ICONS.prestige,
          title: 'Prestige Complete!',
          subtitle: `Level ${data.newLevel} - ${data.pointsGained} points earned`,
          color: 'from-yellow-500 to-orange-500',
        });
      })
    );

    // T6 seed obtained (legendary) - check gacha pulls
    unsubscribers.push(
      eventBus.on('gachaPull', event => {
        const data = event.payload as { item?: { tier: number; name: string } };
        if (data.item && data.item.tier === 6) {
          showCelebration({
            id: `legendary-${Date.now()}`,
            icon: MILESTONE_ICONS.legendary,
            title: 'LEGENDARY SEED!',
            subtitle: data.item.name,
            color: 'from-purple-500 to-pink-500',
          });
        }
      })
    );

    // Seed fused to T6
    unsubscribers.push(
      eventBus.on('seedFused', event => {
        const data = event.payload as { seed?: { tier: number; name: string } };
        if (data.seed && data.seed.tier === 6) {
          showCelebration({
            id: `legendary-fuse-${Date.now()}`,
            icon: MILESTONE_ICONS.legendary,
            title: 'LEGENDARY FUSION!',
            subtitle: data.seed.name,
            color: 'from-purple-500 to-pink-500',
          });
        }
      })
    );

    // Bumper Harvest (5x yield)
    unsubscribers.push(
      eventBus.on('bumperHarvest', event => {
        const data = event.payload as { planetName?: string };
        showCelebration({
          id: `bumper-${Date.now()}`,
          icon: MILESTONE_ICONS.planet,
          title: 'BUMPER HARVEST!',
          subtitle: `5× yield from ${data.planetName || 'planet'}`,
          color: 'from-green-500 to-yellow-500',
        });
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showCelebration]);

  if (!milestone) return null;

  return (
    <>
      {/* Screen reader announcement */}
      <div role="alert" aria-live="polite" className="sr-only">
        {isVisible && `${milestone.title}: ${milestone.subtitle}`}
      </div>

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={milestone.title}
        onClick={dismiss}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center cursor-pointer',
          'transition-opacity',
          prefersReducedMotion ? 'duration-100' : 'duration-500',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Celebration content */}
        <div
          className={cn(
            'relative z-10 flex flex-col items-center text-center px-4',
            'transition-all',
            prefersReducedMotion ? 'duration-100' : 'duration-500',
            isVisible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-10'
          )}
        >
          {/* Animated particles - only show if reduced motion is off */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 overflow-visible pointer-events-none">
              {[...Array(PARTICLE_COUNT)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="absolute text-yellow-300 animate-ping"
                  style={{
                    width: `${Math.random() * 12 + 8}px`,
                    height: `${Math.random() * 12 + 8}px`,
                    left: `${Math.random() * 300 - 150}px`,
                    top: `${Math.random() * 200 - 100}px`,
                    animationDelay: `${Math.random() * 1000}ms`,
                    animationDuration: `${1200 + Math.random() * 800}ms`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Icon with glow */}
          <div className="relative mb-6">
            <div
              className={cn(
                'absolute inset-0 blur-2xl opacity-50 bg-gradient-to-r',
                milestone.color
              )}
            />
            <div
              className={cn(
                'relative p-6 rounded-full bg-gradient-to-r text-white',
                milestone.color,
                !prefersReducedMotion && 'animate-bounce'
              )}
            >
              {milestone.icon}
            </div>
          </div>

          {/* Title */}
          <h2
            className={cn(
              'text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r mb-2',
              milestone.color,
              !prefersReducedMotion && 'animate-pulse'
            )}
          >
            {milestone.title}
          </h2>

          {/* Subtitle */}
          <p className="text-xl text-white/90 font-medium">{milestone.subtitle}</p>

          {/* Decorative lines */}
          <div className="flex items-center gap-4 mt-4">
            <div className={cn('h-0.5 w-16 bg-gradient-to-r opacity-50', milestone.color)} />
            <Zap
              className={cn('w-5 h-5 text-yellow-400', !prefersReducedMotion && 'animate-pulse')}
            />
            <div className={cn('h-0.5 w-16 bg-gradient-to-l opacity-50', milestone.color)} />
          </div>

          {/* Dismiss hint */}
          <p className="mt-6 text-sm text-white/50">Click or press ESC to dismiss</p>
        </div>
      </div>
    </>
  );
};

export default MilestoneCelebration;
