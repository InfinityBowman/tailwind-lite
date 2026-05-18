/**
 * Sparkle Component
 * Adds sparkle effect around content (for rare/special items)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SparkleInstance {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface SparkleProps {
  active?: boolean;
  color?: string;
  minSize?: number;
  maxSize?: number;
  count?: number;
  children: React.ReactNode;
  className?: string;
}

const Sparkle: React.FC<SparkleProps> = ({
  active = true,
  color = '#FFC700',
  minSize = 10,
  maxSize = 20,
  count = 3,
  children,
  className,
}) => {
  const [sparkles, setSparkles] = useState<SparkleInstance[]>([]);
  const prefersReducedMotion = useReducedMotion();

  const generateSparkle = useCallback(
    (): SparkleInstance => ({
      id: Date.now() + Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      delay: Math.random() * 1000,
    }),
    [minSize, maxSize]
  );

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      setSparkles([]);
      return;
    }

    // Initial sparkles
    setSparkles(Array.from({ length: count }, generateSparkle));

    // Regenerate sparkles periodically
    const interval = setInterval(() => {
      setSparkles(prev => {
        const newSparkles = [...prev];
        const indexToReplace = Math.floor(Math.random() * count);
        newSparkles[indexToReplace] = generateSparkle();
        return newSparkles;
      });
    }, 750);

    return () => clearInterval(interval);
  }, [active, count, generateSparkle, prefersReducedMotion]);

  return (
    <span className={cn('relative inline-block', className)}>
      {children}
      {active &&
        !prefersReducedMotion &&
        sparkles.map(sparkle => (
          <svg
            key={sparkle.id}
            className="absolute pointer-events-none animate-[sparkle_700ms_ease-in-out_forwards]"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              width: sparkle.size,
              height: sparkle.size,
              animationDelay: `${sparkle.delay}ms`,
            }}
            viewBox="0 0 160 160"
          >
            <path
              d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
              fill={color}
            />
          </svg>
        ))}
      <style>{`
        @keyframes sparkle {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(90deg); opacity: 1; }
          100% { transform: scale(0) rotate(180deg); opacity: 0; }
        }
      `}</style>
    </span>
  );
};

export default Sparkle;
