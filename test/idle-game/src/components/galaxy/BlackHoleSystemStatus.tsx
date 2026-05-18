/**
 * Black Hole System Status Component
 *
 * Displays the stability status of a black hole star system,
 * including production multipliers, event horizon state, planet status summary, and warnings.
 *
 * @see SystemStatusPanels.tsx for the CurrentSystemStatus wrapper
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Circle, Sparkles, Skull, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { BlackHoleSystemState } from '../../game/systems/StarSystemsSystem';
import {
  getStabilityStatus,
  getBlackHoleProductionMultiplier,
  checkEventHorizon,
} from '../../game/systems/StarSystemsSystem';

type StabilityLevel = 'stable' | 'unstable' | 'critical' | 'collapse';

const STABILITY_DISPLAY: Record<
  StabilityLevel,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  stable: {
    label: 'Stable',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    icon: Circle,
  },
  unstable: {
    label: 'Unstable',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    icon: Zap,
  },
  critical: {
    label: 'Critical',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    icon: Zap,
  },
  collapse: {
    label: 'Collapsing',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    icon: Skull,
  },
};

export interface BlackHoleSystemStatusProps {
  blackHoleState: BlackHoleSystemState;
}

export const BlackHoleSystemStatus: React.FC<BlackHoleSystemStatusProps> = ({ blackHoleState }) => {
  const { planetStability, eventHorizonActive, collapsedPlanets } = blackHoleState;

  // Calculate overall stability (average of all planets, or 100 if none)
  const stabilityValues = Object.values(planetStability);
  const avgStability =
    stabilityValues.length > 0
      ? stabilityValues.reduce((a, b) => a + b, 0) / stabilityValues.length
      : 100;
  const overallStatus = getStabilityStatus(avgStability);
  const productionMult = getBlackHoleProductionMultiplier(avgStability, eventHorizonActive);
  const isEventHorizonPossible = checkEventHorizon(planetStability);

  const statusDisplay = STABILITY_DISPLAY[overallStatus];
  const StatusIcon = statusDisplay.icon;

  // Count planets by stability status
  const statusCounts = stabilityValues.reduce(
    (acc, stability) => {
      const status = getStabilityStatus(stability);
      acc[status]++;
      return acc;
    },
    { stable: 0, unstable: 0, critical: 0, collapse: 0 } as Record<StabilityLevel, number>
  );

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Skull className="w-5 h-5 text-rose-400" />
          Black Hole Stability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall Stability Status */}
        <div className={cn('flex items-center gap-3 p-2 rounded', statusDisplay.bgColor)}>
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              'bg-slate-900/50'
            )}
          >
            <StatusIcon className={cn('w-6 h-6', statusDisplay.color)} />
          </div>
          <div className="flex-1">
            <div className={cn('font-semibold', statusDisplay.color)}>{statusDisplay.label}</div>
            <div className="text-xs text-slate-400">
              {Math.round(avgStability)}% average stability
            </div>
          </div>
        </div>

        {/* Stability Progress */}
        <div>
          <Progress
            value={avgStability}
            className="h-1.5"
            aria-label="Average stability"
            aria-valuenow={Math.round(avgStability)}
          />
        </div>

        {/* Production & Event Horizon */}
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-slate-700/30 rounded p-2 cursor-help">
                  <div className="text-slate-500 text-xs">Production</div>
                  <div className="font-medium text-rose-400">{productionMult.toFixed(0)}x</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px] text-center">
                <p>
                  Base 10x production from gravitational time dilation. Doubled during Event
                  Horizon.
                </p>
                <p className="text-amber-400 mt-1 text-xs">
                  Below 75% stability: -10% production penalty
                </p>
                <p className="text-purple-400 mt-0.5 text-xs">
                  Event Horizon active: 2x multiplier (but high collapse risk!)
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'bg-slate-700/30 rounded p-2 cursor-help',
                    eventHorizonActive && 'ring-1 ring-purple-500/50'
                  )}
                >
                  <div className="text-slate-500 text-xs">Event Horizon</div>
                  <div
                    className={cn(
                      'font-medium',
                      eventHorizonActive ? 'text-purple-400' : 'text-slate-500'
                    )}
                  >
                    {eventHorizonActive ? 'ACTIVE' : 'Inactive'}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-center">
                <p>
                  When all planets drop below 50% stability, Event Horizon activates: 2x production
                  but collapse risk increases.
                </p>
                <p className="text-slate-400 mt-1 text-xs">
                  {eventHorizonActive
                    ? 'Stabilize planets to deactivate and prevent collapse!'
                    : 'Keep stability high to avoid triggering.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Planet Status Summary */}
        {stabilityValues.length > 0 && (
          <div className="flex gap-2 text-xs">
            {statusCounts.stable > 0 && (
              <div className="flex items-center gap-1 text-emerald-400">
                <Circle className="w-3 h-3" />
                <span>{statusCounts.stable}</span>
              </div>
            )}
            {statusCounts.unstable > 0 && (
              <div className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3" />
                <span>{statusCounts.unstable}</span>
              </div>
            )}
            {statusCounts.critical > 0 && (
              <div className="flex items-center gap-1 text-orange-400">
                <Zap className="w-3 h-3" />
                <span>{statusCounts.critical}</span>
              </div>
            )}
            {statusCounts.collapse > 0 && (
              <div className="flex items-center gap-1 text-red-400">
                <Skull className="w-3 h-3" />
                <span>{statusCounts.collapse}</span>
              </div>
            )}
            <div className="text-slate-500 ml-1">planets</div>
          </div>
        )}

        {/* Collapsed Planets Warning */}
        {collapsedPlanets.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
            <Skull className="w-4 h-4" />
            <span>
              {collapsedPlanets.length} planet{collapsedPlanets.length !== 1 ? 's' : ''} collapsed!
              Re-purchase to restore.
            </span>
          </div>
        )}

        {/* Event Horizon Warning */}
        {isEventHorizonPossible && !eventHorizonActive && (
          <div className="flex items-center gap-2 p-2 bg-purple-500/20 border border-purple-500/30 rounded text-purple-400 text-sm">
            <Zap className="w-4 h-4" />
            <span>Event Horizon imminent! All planets below 50% stability.</span>
          </div>
        )}

        {/* Event Horizon Active Alert */}
        {eventHorizonActive && (
          <div className="flex items-center gap-2 p-2 bg-purple-500/30 border border-purple-500/50 rounded text-purple-300 text-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Event Horizon active! 2x production, collapse risk high.</span>
          </div>
        )}

        {/* Stability Levels Reference */}
        <div className="text-xs text-slate-500">
          <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
            {(['stable', 'unstable', 'critical', 'collapse'] as StabilityLevel[]).map(level => (
              <div
                key={level}
                className={cn(
                  'text-center',
                  level === overallStatus && 'text-slate-300 font-medium'
                )}
              >
                <div>{STABILITY_DISPLAY[level].label}</div>
                <div className={STABILITY_DISPLAY[level].color}>
                  {level === 'stable' && '75-100%'}
                  {level === 'unstable' && '50-75%'}
                  {level === 'critical' && '25-50%'}
                  {level === 'collapse' && '0-25%'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlackHoleSystemStatus;
