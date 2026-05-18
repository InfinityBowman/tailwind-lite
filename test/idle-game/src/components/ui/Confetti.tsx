/**
 * Confetti Component
 * Celebration effect for achievements/milestones
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  duration?: number;
  pieceCount?: number;
  className?: string;
}

const COLORS = [
  'bg-red-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
];

const Confetti: React.FC<ConfettiProps> = ({
  active,
  onComplete,
  duration = 3000,
  pieceCount = 50,
  className,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active || prefersReducedMotion) return;

    // Generate confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 500,
      duration: 2000 + Math.random() * 1000,
    }));

    setPieces(newPieces);

    // Clear after duration
    const timer = setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration, pieceCount, onComplete, prefersReducedMotion]);

  if (!active || prefersReducedMotion || pieces.length === 0) return null;

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-50 overflow-hidden', className)}>
      {pieces.map(piece => (
        <div
          key={piece.id}
          className={cn('absolute w-3 h-3 rounded-sm', piece.color)}
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            animation: `confetti-fall ${piece.duration}ms ease-out ${piece.delay}ms forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Confetti;
