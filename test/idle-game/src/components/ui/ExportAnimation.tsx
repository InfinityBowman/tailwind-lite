/**
 * Export Animation
 * Shows visual feedback when resources are exported from planets to inventory
 * Plants fly toward the Resources panel (not currency - exporting doesn't auto-sell!)
 *
 * Accessibility: Respects prefers-reduced-motion preference
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { eventBus } from '../../game/core/EventBus';
import { useReducedMotion } from '../../hooks';
import { Leaf, Package } from 'lucide-react';

// Animation timing constants
const ANIMATION_DURATION_MS = 600;
const PARTICLE_STAGGER_MS = 80;
const BURST_CLEANUP_DELAY_MS = 1200;
const MAX_CONCURRENT_BURSTS = 5;
const MAX_PARTICLES_PER_BURST = 5;

interface ExportParticle {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  plantType: string;
  amount: number;
  delay: number;
}

interface ExportBurst {
  id: string;
  particles: ExportParticle[];
  totalAmount: number;
}

// Random starting positions around the edges of viewport
function getRandomStartPosition(): { x: number; y: number } {
  const side = Math.random();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Start from bottom half of screen (where planets are)
  if (side < 0.5) {
    // Left side
    return { x: 50, y: viewportHeight * 0.4 + Math.random() * viewportHeight * 0.4 };
  } else {
    // Right side
    return {
      x: viewportWidth - 50,
      y: viewportHeight * 0.4 + Math.random() * viewportHeight * 0.4,
    };
  }
}

// Target position - the Resources panel area (middle-right of screen)
// Exporting moves plants to inventory, NOT to currency!
function getTargetPosition(): { x: number; y: number } {
  // Try to find the Resources card by looking for the data attribute we'll add
  const resourcesCard = document.querySelector('[data-resources-panel]');
  if (resourcesCard) {
    const rect = resourcesCard.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + 40 };
  }
  // Fallback: approximate middle-right area where Resources panel typically is
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  return { x: viewportWidth - 200, y: viewportHeight * 0.35 };
}

const ExportAnimation: React.FC = () => {
  const [bursts, setBursts] = useState<ExportBurst[]>([]);
  const burstCountRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const handleResourceCollected = useCallback(
    (event: { payload: { type: string; amount: number }[] }) => {
      const resources = event.payload;
      if (!resources || resources.length === 0) return;

      // Calculate total for display
      const totalAmount = resources.reduce((sum, r) => sum + Math.floor(r.amount), 0);

      // Don't show animation for tiny amounts
      if (totalAmount < 1) return;

      // Skip particle animation for reduced motion users - just show the credit burst
      if (prefersReducedMotion) {
        const target = getTargetPosition();
        const burst: ExportBurst = {
          id: `burst-${Date.now()}`,
          particles: [
            {
              id: `particle-${Date.now()}-0`,
              x: target.x,
              y: target.y,
              targetX: target.x,
              targetY: target.y,
              plantType: resources[0]?.type || 'plant',
              amount: totalAmount,
              delay: 0,
            },
          ],
          totalAmount,
        };

        setBursts(prev => [...prev, burst]);
        setTimeout(() => {
          setBursts(prev => prev.filter(b => b.id !== burst.id));
        }, 1500);
        return;
      }

      // Limit concurrent bursts to prevent performance issues
      if (burstCountRef.current >= MAX_CONCURRENT_BURSTS) return;
      burstCountRef.current++;

      // Create particles (limit to avoid too many)
      const particleCount = Math.min(resources.length, MAX_PARTICLES_PER_BURST);
      const target = getTargetPosition();

      const particles: ExportParticle[] = resources
        .slice(0, particleCount)
        .map((resource, index) => {
          const start = getRandomStartPosition();
          return {
            id: `particle-${Date.now()}-${index}`,
            x: start.x,
            y: start.y,
            targetX: target.x,
            targetY: target.y,
            plantType: resource.type,
            amount: Math.floor(resource.amount),
            delay: index * PARTICLE_STAGGER_MS,
          };
        });

      const burst: ExportBurst = {
        id: `burst-${Date.now()}`,
        particles,
        totalAmount,
      };

      setBursts(prev => [...prev, burst]);

      // Remove burst after animation completes
      setTimeout(() => {
        setBursts(prev => prev.filter(b => b.id !== burst.id));
        burstCountRef.current = Math.max(0, burstCountRef.current - 1);
      }, BURST_CLEANUP_DELAY_MS);
    },
    [prefersReducedMotion]
  );

  useEffect(() => {
    const unsubscribe = eventBus.on('resourceCollected', handleResourceCollected);
    return () => unsubscribe();
  }, [handleResourceCollected]);

  if (bursts.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden="true">
      {bursts.map(burst => (
        <React.Fragment key={burst.id}>
          {/* Flying particles - only show if not reduced motion */}
          {!prefersReducedMotion &&
            burst.particles.map(particle => (
              <div
                key={particle.id}
                className="absolute"
                style={
                  {
                    left: particle.x,
                    top: particle.y,
                    animation: `exportFly ${ANIMATION_DURATION_MS}ms ease-in-out ${particle.delay}ms forwards`,
                    '--target-x': `${particle.targetX - particle.x}px`,
                    '--target-y': `${particle.targetY - particle.y}px`,
                  } as React.CSSProperties
                }
              >
                <div className="relative">
                  <Leaf className="w-5 h-5 text-green-400 drop-shadow-lg" />
                  <div className="absolute -bottom-1 -right-1 text-xs font-bold text-white bg-green-600 rounded-full w-4 h-4 flex items-center justify-center shadow">
                    {particle.amount > 9 ? '+' : particle.amount}
                  </div>
                </div>
              </div>
            ))}

          {/* Resource collected indicator at target */}
          <div
            className="absolute flex items-center gap-1.5 animate-fadeInUp px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-green-500/30"
            style={{
              left: burst.particles[0]?.targetX || 0,
              top: (burst.particles[0]?.targetY || 0) - 20,
              animationDelay: prefersReducedMotion ? '0ms' : '500ms',
            }}
          >
            <Package className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold text-green-300">+{burst.totalAmount} collected</span>
          </div>
        </React.Fragment>
      ))}

      {/* Animation styles */}
      <style>{`
        @keyframes exportFly {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out forwards;
          opacity: 0;
        }
        
        /* Reduced motion: instant transitions */
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeInUp {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ExportAnimation;
