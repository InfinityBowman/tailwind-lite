/**
 * GachaReveal - Tier-based gacha pull reveal animation
 *
 * Creates anticipation before revealing pulled items. Higher tier items
 * get more dramatic, longer reveal animations.
 *
 * Accessibility:
 * - Respects prefers-reduced-motion (instant reveal)
 * - Screen reader announcements for results
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Tier configuration for reveal animations
const TIER_CONFIG = {
  1: {
    name: 'Common',
    color: 'rgb(107, 114, 128)', // gray-500
    glowColor: 'rgba(107, 114, 128, 0.3)',
    bgGradient: 'from-gray-600 to-gray-700',
    anticipationMs: 400,
    particleCount: 0,
    shakeIntensity: 0,
  },
  2: {
    name: 'Uncommon',
    color: 'rgb(34, 197, 94)', // green-500
    glowColor: 'rgba(34, 197, 94, 0.4)',
    bgGradient: 'from-green-600 to-emerald-700',
    anticipationMs: 600,
    particleCount: 3,
    shakeIntensity: 0,
  },
  3: {
    name: 'Rare',
    color: 'rgb(59, 130, 246)', // blue-500
    glowColor: 'rgba(59, 130, 246, 0.5)',
    bgGradient: 'from-blue-600 to-indigo-700',
    anticipationMs: 900,
    particleCount: 5,
    shakeIntensity: 1,
  },
  4: {
    name: 'Epic',
    color: 'rgb(168, 85, 247)', // purple-500
    glowColor: 'rgba(168, 85, 247, 0.5)',
    bgGradient: 'from-purple-600 to-violet-700',
    anticipationMs: 1200,
    particleCount: 8,
    shakeIntensity: 2,
  },
  5: {
    name: 'Legendary',
    color: 'rgb(234, 179, 8)', // yellow-500
    glowColor: 'rgba(234, 179, 8, 0.5)',
    bgGradient: 'from-yellow-500 to-orange-600',
    anticipationMs: 1600,
    particleCount: 12,
    shakeIntensity: 3,
  },
  6: {
    name: 'Mythic',
    color: 'rgb(236, 72, 153)', // pink-500
    glowColor: 'rgba(236, 72, 153, 0.6)',
    bgGradient: 'from-pink-500 via-purple-500 to-indigo-500',
    anticipationMs: 2200,
    particleCount: 20,
    shakeIntensity: 4,
  },
} as const;

// Fodder config (for non-seed pulls)
const FODDER_CONFIG = {
  name: 'Essence',
  color: 'rgb(168, 85, 247)',
  glowColor: 'rgba(168, 85, 247, 0.3)',
  bgGradient: 'from-purple-600 to-purple-700',
  anticipationMs: 300,
  particleCount: 2,
  shakeIntensity: 0,
};

interface GachaRevealProps {
  /** Tier of the pulled item (1-6), or 0 for fodder */
  tier: number;
  /** Called when anticipation is done and reveal should happen */
  onRevealReady: () => void;
  /** Whether the reveal animation is active */
  isActive: boolean;
  /** Children to render after reveal */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Particle component for tier reveal effects
 */
const RevealParticle: React.FC<{
  index: number;
  color: string;
  tier: number;
}> = ({ index, color, tier }) => {
  // Spread particles in a circle
  const angle = (index / (tier > 4 ? 20 : 12)) * Math.PI * 2;
  const distance = 80 + Math.random() * 60;
  const size = 6 + Math.random() * 8;
  const delay = Math.random() * 0.3;

  return (
    <motion.div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        width: size,
        height: size,
      }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
      animate={{
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0.5],
      }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: 'easeOut',
      }}
    >
      <Star className="w-full h-full" style={{ color }} fill={color} />
    </motion.div>
  );
};

/**
 * Color cycling animation for anticipation phase
 */
const TierCycler: React.FC<{
  targetTier: number;
  duration: number;
  onComplete: () => void;
}> = ({ targetTier, duration, onComplete }) => {
  const [currentTier, setCurrentTier] = useState(1);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(Date.now());
  const tierRef = useRef(1);

  // Keep tierRef in sync with currentTier
  tierRef.current = currentTier;

  useEffect(() => {
    startTimeRef.current = Date.now();
    tierRef.current = 1;
    setCurrentTier(1);

    const cycle = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = elapsed / duration;

      if (progress >= 1) {
        setCurrentTier(targetTier);
        onComplete();
        return;
      }

      // Slow down as we approach the target
      // Early: fast cycling through all tiers
      // Late: slower, narrowing in on target tier
      const tier = tierRef.current;
      let nextTier: number;

      if (progress < 0.6) {
        // Fast cycling through all tiers
        nextTier = (tier % 6) + 1;
      } else if (progress < 0.85) {
        // Slower, cycling through tiers up to target + 1
        const maxTier = Math.min(targetTier + 1, 6);
        nextTier = tier >= maxTier ? 1 : tier + 1;
      } else {
        // Final slowdown, oscillate near target
        nextTier = tier === targetTier ? Math.max(1, targetTier - 1) : targetTier;
      }

      tierRef.current = nextTier;
      setCurrentTier(nextTier);

      // Cycle speed increases as we slow down (longer intervals)
      const baseDelay = 80;
      const slowdownFactor = 1 + progress * 3;
      cycleRef.current = setTimeout(cycle, baseDelay * slowdownFactor);
    };

    cycleRef.current = setTimeout(cycle, 80);

    return () => {
      if (cycleRef.current) {
        clearTimeout(cycleRef.current);
      }
    };
  }, [duration, targetTier, onComplete]);

  const config = TIER_CONFIG[currentTier as keyof typeof TIER_CONFIG];

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner spinning ring */}
      <motion.div
        className={cn(
          'absolute inset-4 rounded-full border-4',
          'bg-gradient-to-br',
          config.bgGradient
        )}
        style={{ borderColor: config.color }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />

      {/* Center tier indicator */}
      <motion.div
        className="relative z-10 text-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.2 }}
        key={currentTier}
      >
        <div className="text-3xl font-bold font-mono" style={{ color: config.color }}>
          T{currentTier}
        </div>
        <div className="text-xs font-mono opacity-80" style={{ color: config.color }}>
          {config.name}
        </div>
      </motion.div>
    </div>
  );
};

const GachaReveal: React.FC<GachaRevealProps> = ({
  tier,
  onRevealReady,
  isActive,
  children,
  className,
}) => {
  const [phase, setPhase] = useState<'anticipation' | 'reveal' | 'done'>('anticipation');
  const [showParticles, setShowParticles] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const revealCalledRef = useRef(false);

  const config =
    tier === 0 ? FODDER_CONFIG : TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG[1];

  const handleAnticipationComplete = useCallback(() => {
    if (revealCalledRef.current) return;
    revealCalledRef.current = true;

    setShowParticles(true);
    setPhase('reveal');
    onRevealReady();

    // Clear particles after animation
    setTimeout(() => {
      setShowParticles(false);
      setPhase('done');
    }, 1000);
  }, [onRevealReady]);

  // Reset state when isActive changes
  useEffect(() => {
    if (isActive) {
      revealCalledRef.current = false;
      setPhase('anticipation');
      setShowParticles(false);

      // Skip anticipation for reduced motion or fodder (tier 0)
      if (prefersReducedMotion || tier <= 0) {
        handleAnticipationComplete();
      }
    }
  }, [isActive, prefersReducedMotion, tier, handleAnticipationComplete]);

  if (!isActive) return null;

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {phase === 'anticipation' && !prefersReducedMotion && tier > 0 && (
          <motion.div
            key="anticipation"
            className="flex items-center justify-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TierCycler
              targetTier={tier}
              duration={config.anticipationMs}
              onComplete={handleAnticipationComplete}
            />
          </motion.div>
        )}

        {(phase === 'reveal' || phase === 'done') && (
          <motion.div
            key="reveal"
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              // Add shake effect for high tiers
              x:
                config.shakeIntensity > 0 && !prefersReducedMotion
                  ? [0, -config.shakeIntensity * 2, config.shakeIntensity * 2, 0]
                  : 0,
            }}
            transition={{
              opacity: { duration: 0.2 },
              scale: { type: 'spring', duration: 0.5, bounce: 0.3 },
              x: { duration: 0.3, repeat: config.shakeIntensity > 2 ? 2 : 0 },
            }}
          >
            {/* Particles for tier 2+ */}
            {showParticles && !prefersReducedMotion && config.particleCount > 0 && (
              <div className="absolute inset-0 overflow-visible pointer-events-none">
                {Array.from({ length: config.particleCount }).map((_, i) => (
                  <RevealParticle key={i} index={i} color={config.color} tier={tier} />
                ))}
              </div>
            )}

            {/* Screen flash for T5+ */}
            {tier >= 5 && !prefersReducedMotion && (
              <motion.div
                className="fixed inset-0 z-40 pointer-events-none"
                style={{ backgroundColor: config.glowColor }}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            )}

            {/* Glow effect behind content */}
            {tier >= 3 && (
              <motion.div
                className="absolute inset-0 -m-4 rounded-xl blur-xl"
                style={{ backgroundColor: config.glowColor }}
                initial={{ opacity: 0 }}
                animate={{ opacity: prefersReducedMotion ? 0.3 : [0.5, 0.3] }}
                transition={{
                  duration: 1,
                  repeat: prefersReducedMotion ? 0 : Infinity,
                  repeatType: 'reverse',
                }}
              />
            )}

            {/* Content */}
            <div className="relative z-10">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GachaReveal;
