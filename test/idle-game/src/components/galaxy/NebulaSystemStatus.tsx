/**
 * Nebula System Status Component
 *
 * Displays the current density level of a nebula star system,
 * including refinement and production modifiers, crystal availability, and critical warnings.
 *
 * @see SystemStatusPanels.tsx for the CurrentSystemStatus wrapper
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { NebulaSystemState } from '../../game/systems/StarSystemsSystem';
import {
  getNebulaDensityLevel,
  getNebulaRefinementMultiplier,
  getNebulaProductionModifier,
} from '../../game/systems/StarSystemsSystem';

type NebulaDensityLevel = 'sparse' | 'dense' | 'thick' | 'critical';

const DENSITY_DISPLAY: Record<
  NebulaDensityLevel,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  sparse: {
    icon: Sparkles,
    label: 'Sparse',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
  dense: {
    icon: Sparkles,
    label: 'Dense',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
  thick: {
    icon: Sparkles,
    label: 'Thick',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  critical: {
    icon: Sparkles,
    label: 'Critical',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
};

export interface NebulaSystemStatusProps {
  nebulaState: NebulaSystemState;
}

export const NebulaSystemStatus: React.FC<NebulaSystemStatusProps> = ({ nebulaState }) => {
  const density = nebulaState.density;
  const densityLevel = getNebulaDensityLevel(density);
  const refinementMult = getNebulaRefinementMultiplier(density);
  const productionMod = getNebulaProductionModifier(density);
  const crystalsAvailable = nebulaState.crystalsAvailable;

  const densityDisplay = DENSITY_DISPLAY[densityLevel];
  const DensityIcon = densityDisplay.icon;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Nebula Density
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Density Level */}
        <div className={cn('flex items-center gap-3 p-2 rounded', densityDisplay.bgColor)}>
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              'bg-slate-900/50'
            )}
          >
            <DensityIcon className={cn('w-6 h-6', densityDisplay.color)} />
          </div>
          <div className="flex-1">
            <div className={cn('font-semibold', densityDisplay.color)}>{densityDisplay.label}</div>
            <div className="text-xs text-slate-400">{Math.round(density)}% density</div>
          </div>
        </div>

        {/* Density Progress */}
        <div>
          <Progress
            value={density}
            className="h-1.5"
            aria-label="Nebula density"
            aria-valuenow={Math.round(density)}
          />
        </div>

        {/* Multipliers */}
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-slate-700/30 rounded p-2 cursor-help">
                  <div className="text-slate-500 text-xs">Refinement</div>
                  <div className="font-medium text-purple-400">{refinementMult.toFixed(1)}x</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-center">
                <p>Essence yield from refining plants. Base 3x, up to 4.5x at critical density.</p>
                <p className="text-slate-400 mt-1 text-xs">
                  Higher density = more essence per plant. Worth the slower growth for rare seeds.
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-slate-700/30 rounded p-2 cursor-help">
                  <div className="text-slate-500 text-xs">Production</div>
                  <div
                    className={cn(
                      'font-medium',
                      productionMod >= 1 ? 'text-emerald-400' : 'text-amber-400'
                    )}
                  >
                    {productionMod >= 1
                      ? 'No penalty'
                      : `-${Math.round((1 - productionMod) * 100)}%`}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-center">
                <p>Plant growth speed modifier. Higher density slows production.</p>
                <p className="text-slate-400 mt-1 text-xs">
                  Balance density with your goals: fast harvests at sparse, max essence at critical.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Crystals Available */}
        {crystalsAvailable > 0 && (
          <div className="flex items-center gap-2 p-2 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>
              {crystalsAvailable} Essence Crystal{crystalsAvailable !== 1 ? 's' : ''} available!
            </span>
          </div>
        )}

        {/* Critical Warning */}
        {densityLevel === 'critical' && (
          <div className="flex items-center gap-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
            <Zap className="w-4 h-4" />
            <span>Critical density! Auto-dispersion at 100% will force harvest.</span>
          </div>
        )}

        {/* Density Levels Reference */}
        <div className="text-xs text-slate-500">
          <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
            {(['sparse', 'dense', 'thick', 'critical'] as NebulaDensityLevel[]).map(level => (
              <div
                key={level}
                className={cn(
                  'text-center',
                  level === densityLevel && 'text-slate-300 font-medium'
                )}
              >
                <div>{DENSITY_DISPLAY[level].label}</div>
                <div className={DENSITY_DISPLAY[level].color}>
                  {level === 'sparse' && '0-25%'}
                  {level === 'dense' && '25-50%'}
                  {level === 'thick' && '50-75%'}
                  {level === 'critical' && '75-100%'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NebulaSystemStatus;
