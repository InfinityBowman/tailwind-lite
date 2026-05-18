/**
 * Floating Text
 * Text that floats up and fades (for gain indicators like "+100")
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FloatingTextProps {
  text: string;
  x: number; // Percentage position
  y: number; // Percentage position
  color?: 'green' | 'red' | 'yellow' | 'purple' | 'white';
  onComplete?: () => void;
  duration?: number;
}

const colors = {
  green: 'text-green-400',
  red: 'text-red-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
  white: 'text-white',
};

const FloatingText: React.FC<FloatingTextProps> = ({
  text,
  x,
  y,
  color = 'green',
  onComplete,
  duration = 1500,
}) => {
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!visible) return null;

  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          'absolute font-bold text-lg pointer-events-none px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm',
          colors[color]
        )}
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        {text}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'absolute font-bold text-lg pointer-events-none px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm',
        colors[color],
        'animate-[float-up_1.5s_ease-out_forwards]'
      )}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {text}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-50px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingText;
