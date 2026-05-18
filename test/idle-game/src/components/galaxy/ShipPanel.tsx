/**
 * Ship Panel Component
 *
 * Displays ship status including:
 * - Current location and travel destination
 * - Travel progress with ETA countdown
 * - Cargo capacity and unload button
 * - Upgrade level with upgrade button
 *
 * @see GalaxyMapPanel.tsx for the parent container
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Rocket, ArrowRight, Clock, Package } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { StarSystem, TravelShip } from '../../game/systems/StarSystemsSystem';
import { formatTime } from './types';

export interface ShipPanelProps {
  ship: TravelShip;
  systems: Record<string, StarSystem>;
  onUpgradeShip: () => void;
  onUnloadCargo: () => void;
  canUpgrade: boolean;
  upgradeCost: number | null;
}

export const ShipPanel: React.FC<ShipPanelProps> = ({
  ship,
  systems,
  onUpgradeShip,
  onUnloadCargo,
  canUpgrade,
  upgradeCost,
}) => {
  const isInTransit = ship.destinationSystem !== null && ship.travelStartTime !== null;
  const [travelProgress, setTravelProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  // Update travel progress on a timer
  useEffect(() => {
    if (!isInTransit || !ship.travelStartTime) {
      setTravelProgress(0);
      setRemainingTime(0);
      return () => {}; // Always return cleanup function
    }

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const elapsed = Date.now() - ship.travelStartTime!;
      setTravelProgress(Math.min(100, (elapsed / ship.travelDuration) * 100));
      setRemainingTime(Math.max(0, ship.travelDuration - elapsed));
    };

    tick(); // Initial calculation
    const interval = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isInTransit, ship.travelStartTime, ship.travelDuration]);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="w-5 h-5 text-blue-400" />
          Ship Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Location */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Location</span>
          <span className="text-white">
            {isInTransit ? (
              <span className="flex items-center gap-1">
                <span>{systems[ship.currentSystem || '']?.name || 'Unknown'}</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">
                  {systems[ship.destinationSystem || '']?.name || 'Unknown'}
                </span>
              </span>
            ) : (
              systems[ship.currentSystem || '']?.name || 'Docked'
            )}
          </span>
        </div>

        {/* Travel Progress */}
        {isInTransit && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ETA
              </span>
              <span className="text-emerald-400">{formatTime(remainingTime)}</span>
            </div>
            <Progress
              value={travelProgress}
              className="h-2"
              aria-label="Travel progress"
              aria-valuenow={Math.round(travelProgress)}
            />
          </div>
        )}

        {/* Cargo */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 flex items-center gap-1">
            <Package className="w-4 h-4" />
            Cargo
          </span>
          <div className="flex items-center gap-2">
            <span className="text-white">
              {ship.cargo.length} / {ship.maxCargo}
            </span>
            {ship.cargo.length > 0 && !isInTransit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={onUnloadCargo}
              >
                Unload
              </Button>
            )}
          </div>
        </div>

        {/* Upgrade Level */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Upgrade Level</span>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">Lv. {ship.upgradeLevel}</span>
            {upgradeCost !== null && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-6 px-2 text-xs',
                  canUpgrade
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-slate-500 cursor-not-allowed'
                )}
                onClick={onUpgradeShip}
                disabled={!canUpgrade}
                title={canUpgrade ? undefined : `Need ${upgradeCost.toLocaleString()} credits`}
              >
                Upgrade ({(upgradeCost / 1000).toFixed(0)}k)
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShipPanel;
