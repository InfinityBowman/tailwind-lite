/**
 * Star System Card Component
 *
 * Displays an individual star system in the galaxy map, including:
 * - System icon and type-specific visual styling
 * - Current location / destination indicators
 * - Mastery progress for unlocked systems
 * - Unlock requirements for locked systems
 * - Travel button
 *
 * @see GalaxyMapPanel.tsx for the parent container
 */

import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lock, Rocket } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { StarSystem, TravelShip } from '../../game/systems/StarSystemsSystem';
import { SYSTEM_VISUALS } from './types';

export interface StarSystemCardProps {
  system: StarSystem;
  isCurrentLocation: boolean;
  isTravelDestination: boolean;
  ship: TravelShip;
  onSelect: (systemId: string) => void;
  onTravel: (systemId: string) => void;
}

export const StarSystemCard: React.FC<StarSystemCardProps> = ({
  system,
  isCurrentLocation,
  isTravelDestination,
  ship,
  onSelect,
  onTravel,
}) => {
  const visual = SYSTEM_VISUALS[system.type];
  const Icon = visual.icon;
  const isLocked = !system.unlocked;
  const canTravel = !isLocked && !isCurrentLocation && ship.currentSystem !== null;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(system.id);
      }
    },
    [onSelect, system.id]
  );

  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all hover:scale-[1.02]',
        'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900',
        visual.bgColor,
        visual.borderColor,
        'border',
        isCurrentLocation && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900',
        isTravelDestination && 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900',
        isLocked && 'opacity-60'
      )}
      onClick={() => onSelect(system.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${system.name} star system${isLocked ? ' (locked)' : ''}${isCurrentLocation ? ' - current location' : ''}${isTravelDestination ? ' - en route' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* System Icon */}
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              visual.bgColor,
              'border',
              visual.borderColor
            )}
          >
            {isLocked ? (
              <Lock className="w-6 h-6 text-slate-500" />
            ) : (
              <Icon className={cn('w-6 h-6', visual.color)} />
            )}
          </div>

          {/* System Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn('font-semibold', isLocked ? 'text-slate-400' : 'text-white')}>
                {system.name}
              </h3>
              {isCurrentLocation && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                  Current
                </span>
              )}
              {isTravelDestination && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                  En Route
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">{visual.description}</p>

            {/* Mastery Progress */}
            {!isLocked && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Mastery</span>
                  <span className="text-slate-400">{Math.round(system.masteryProgress)}%</span>
                </div>
                <Progress
                  value={system.masteryProgress}
                  className="h-1"
                  aria-label={`${system.name} mastery progress`}
                  aria-valuenow={Math.round(system.masteryProgress)}
                />
              </div>
            )}

            {/* Unlock Requirements */}
            {isLocked && system.unlockRequirements.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                <span>Requires: </span>
                {system.unlockRequirements.map((req, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    {req.type === 'ascensionLevel' && `Ascension ${req.value}`}
                    {req.type === 'prestigePoints' && `${req.value} PP`}
                    {req.type === 'legendaryManagers' && `${req.value} Legendary Managers`}
                    {req.type === 'systemMastery' && `${req.value}% ${req.systemId} Mastery`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Travel Button */}
          {canTravel && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={e => {
                e.stopPropagation();
                onTravel(system.id);
              }}
            >
              <Rocket className="w-4 h-4 mr-1" />
              Travel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StarSystemCard;
