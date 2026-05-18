import React from 'react';
import { type PlanetState } from '../../game';
import { MAX_SEEDS_PER_PLANET } from '../../game/config/balance';
import PlanetImage from '@/components/ui/PlanetImage';
import { cn } from '@/lib/utils';

interface PlanetJumpStripProps {
  planets: PlanetState[];
  activePlanetId?: string | null;
  onJump: (planetId: string) => void;
}

const PlanetJumpStrip: React.FC<PlanetJumpStripProps> = ({ planets, activePlanetId, onJump }) => {
  if (planets.length <= 1) return null;

  return (
    <div className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm border-b py-2 -mx-4 px-4 mb-4">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {planets.map(planet => {
          const seedCount = planet.seeds?.length || 0;
          const hasEmptySlots = seedCount < MAX_SEEDS_PER_PLANET;
          const isEmpty = seedCount === 0;
          const isActive = planet.id === activePlanetId;

          return (
            <button
              key={planet.id}
              onClick={() => onJump(planet.id)}
              className={cn(
                'shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all',
                'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50',
                isActive && 'bg-accent ring-2 ring-primary/50'
              )}
              title={`${planet.name} (${seedCount}/${MAX_SEEDS_PER_PLANET} seeds)`}
            >
              <div className="relative">
                <PlanetImage
                  planetId={planet.id}
                  color={planet.color}
                  size={32}
                  glow={false}
                  pulse={false}
                />
                {/* Attention indicator */}
                {isEmpty && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                )}
                {/* Has empty slots indicator */}
                {hasEmptySlots && !isEmpty && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
              <span className="text-[10px] truncate max-w-[50px] text-muted-foreground">
                {planet.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlanetJumpStrip;
