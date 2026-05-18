/**
 * Binary System Status Component
 *
 * Displays the current phase (dawn/day/dusk/night) of a binary star system,
 * including production and export multipliers, phase progress, and solar flare warnings.
 *
 * @see SystemStatusPanels.tsx for the CurrentSystemStatus wrapper
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sun, Circle, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { BinaryPhase, BinarySystemState } from '../../game/systems/StarSystemsSystem';
import {
  getBinaryPhase,
  getTimeUntilNextPhase,
  getBinaryProductionMultiplier,
  getBinaryExportMultiplier,
  BINARY_PHASE_DURATIONS,
} from '../../game/systems/StarSystemsSystem';
import { formatTimeMMSS } from './types';

const PHASE_DISPLAY: Record<
  BinaryPhase,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  dawn: {
    icon: Sun,
    label: 'Dawn',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/20',
  },
  day: {
    icon: Sun,
    label: 'Day',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  dusk: {
    icon: Sun,
    label: 'Dusk',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
  night: {
    icon: Circle,
    label: 'Night',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/20',
  },
};

export interface BinarySystemStatusProps {
  binaryState: BinarySystemState;
}

export const BinarySystemStatus: React.FC<BinarySystemStatusProps> = ({ binaryState }) => {
  const [phase, setPhase] = useState<BinaryPhase>(() => getBinaryPhase(binaryState));
  const [timeLeft, setTimeLeft] = useState<number>(() => getTimeUntilNextPhase(binaryState));

  // Update phase and countdown every second
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setPhase(getBinaryPhase(binaryState));
      setTimeLeft(getTimeUntilNextPhase(binaryState));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [binaryState]);

  const phaseDisplay = PHASE_DISPLAY[phase];
  const PhaseIcon = phaseDisplay.icon;
  const productionMult = getBinaryProductionMultiplier(phase);
  const exportMult = getBinaryExportMultiplier(phase);

  // Calculate progress through current phase
  const phaseDuration = BINARY_PHASE_DURATIONS[phase];
  const elapsed = phaseDuration - timeLeft;
  const progressPercent = Math.min(100, (elapsed / phaseDuration) * 100);

  // Get next phase name
  const phases: BinaryPhase[] = ['dawn', 'day', 'dusk', 'night'];
  const currentIndex = phases.indexOf(phase);
  const nextPhase = phases[(currentIndex + 1) % phases.length];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Circle className="w-5 h-5 text-orange-400" />
          Binary Cycle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Phase */}
        <div className={cn('flex items-center gap-3 p-2 rounded', phaseDisplay.bgColor)}>
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              'bg-slate-900/50'
            )}
          >
            <PhaseIcon className={cn('w-6 h-6', phaseDisplay.color)} />
          </div>
          <div className="flex-1">
            <div className={cn('font-semibold', phaseDisplay.color)}>{phaseDisplay.label}</div>
            <div className="text-xs text-slate-400">
              {formatTimeMMSS(timeLeft)} until {PHASE_DISPLAY[nextPhase].label.toLowerCase()}
            </div>
          </div>
        </div>

        {/* Phase Progress */}
        <div>
          <Progress
            value={progressPercent}
            className="h-1.5"
            aria-label={`${phase} phase progress`}
            aria-valuenow={Math.round(progressPercent)}
          />
        </div>

        {/* Multipliers */}
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-slate-700/30 rounded p-2 cursor-help">
                  <div className="text-slate-500 text-xs">Production</div>
                  <div
                    className={cn(
                      'font-medium',
                      productionMult >= 1.5 ? 'text-emerald-400' : 'text-amber-400'
                    )}
                  >
                    {productionMult >= 1 ? '+' : ''}
                    {Math.round((productionMult - 1) * 100)}%
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-center">
                <p>
                  Plant growth speed. Day gives +100%, night gives -50%.
                  {phase === 'night' && ' Slower growth, but exports are boosted!'}
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-slate-700/30 rounded p-2 cursor-help">
                  <div className="text-slate-500 text-xs">Exports</div>
                  <div className="font-medium text-emerald-400">{exportMult}x</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-center">
                <p>
                  Trade route capacity. Binary always has 2x base.
                  {phase === 'night' && ' Night doubles it to 4x!'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Solar Flare Warning */}
        {binaryState.solarFlareActive && (
          <div className="flex items-center gap-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
            <Zap className="w-4 h-4" />
            <span>Solar Flare Active!</span>
          </div>
        )}

        {/* Phase Schedule */}
        <div className="text-xs text-slate-500">
          <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
            {phases.map(p => (
              <div
                key={p}
                className={cn('text-center', p === phase && 'text-slate-300 font-medium')}
              >
                <div>{PHASE_DISPLAY[p].label}</div>
                <div className={PHASE_DISPLAY[p].color}>
                  {Math.round(BINARY_PHASE_DURATIONS[p] / 60000)}m
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BinarySystemStatus;
