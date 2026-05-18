/**
 * Dyson Sphere System Status Component
 *
 * Displays the current status of the Dyson Sphere system:
 * - Overall efficiency level
 * - Active construction projects with progress
 * - Available efficiency upgrades
 * - Unique mechanic: unlimited seed capacity
 *
 * @see CurrentSystemStatus.tsx for the wrapper component
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Circle, Wrench, Infinity as InfinityIcon, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DysonSphereState, ConstructionProject } from '../../game/systems/StarSystemsSystem';
import { DYSON_EFFICIENCY_COSTS } from '../../game/systems/StarSystemsSystem';

export interface DysonSystemStatusProps {
  dysonState: DysonSphereState;
}

/** Efficiency tier levels for the reference display */
type EfficiencyTier = 'minimal' | 'low' | 'medium' | 'high' | 'maximum';

const EFFICIENCY_DISPLAY: Record<EfficiencyTier, { label: string; color: string; range: string }> =
  {
    minimal: { label: 'Minimal', color: 'text-red-400', range: '1-10%' },
    low: { label: 'Low', color: 'text-orange-400', range: '10-25%' },
    medium: { label: 'Medium', color: 'text-yellow-400', range: '25-50%' },
    high: { label: 'High', color: 'text-emerald-400', range: '50-75%' },
    maximum: { label: 'Maximum', color: 'text-cyan-400', range: '75-100%' },
  };

/**
 * Get the current efficiency tier
 */
function getEfficiencyTier(efficiency: number): EfficiencyTier {
  if (efficiency >= 75) return 'maximum';
  if (efficiency >= 50) return 'high';
  if (efficiency >= 25) return 'medium';
  if (efficiency >= 10) return 'low';
  return 'minimal';
}

/**
 * Format days remaining for a construction project
 */
function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining <= 0) return 'Complete';
  if (daysRemaining === 1) return '1 day left';
  return `${Math.ceil(daysRemaining)} days left`;
}

/**
 * Get the next available efficiency upgrade
 */
function getNextUpgrade(completedUpgrades: number[]): (typeof DYSON_EFFICIENCY_COSTS)[0] | null {
  const nextIndex = completedUpgrades.length;
  if (nextIndex >= DYSON_EFFICIENCY_COSTS.length) return null;
  return DYSON_EFFICIENCY_COSTS[nextIndex];
}

/**
 * Get efficiency tier color based on percentage
 */
function getEfficiencyColor(efficiency: number): string {
  if (efficiency >= 75) return 'text-cyan-400';
  if (efficiency >= 50) return 'text-emerald-400';
  if (efficiency >= 25) return 'text-yellow-400';
  if (efficiency >= 10) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Single construction project display
 */
const ProjectCard: React.FC<{ project: ConstructionProject }> = ({ project }) => {
  const progressPercent = (project.progressDays / project.totalDays) * 100;
  const daysRemaining = project.totalDays - project.progressDays;

  return (
    <div className="bg-slate-700/30 rounded p-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Wrench className="w-3 h-3 text-blue-400" />
          <span className="text-sm font-medium">{project.name}</span>
        </div>
        {project.complete ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <span className="text-xs text-slate-400">{formatDaysRemaining(daysRemaining)}</span>
        )}
      </div>
      <Progress
        value={progressPercent}
        className="h-1"
        aria-label={`${project.name} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPercent)}
      />
      {!project.complete && (
        <div className="text-xs text-slate-500 mt-1">
          Cost: {project.dailyCost.toLocaleString()} credits/day
        </div>
      )}
    </div>
  );
};

export const DysonSystemStatus: React.FC<DysonSystemStatusProps> = ({ dysonState }) => {
  const { efficiency, activeProjects, completedUpgrades } = dysonState;
  const nextUpgrade = getNextUpgrade(completedUpgrades);
  const efficiencyColor = getEfficiencyColor(efficiency);
  const currentTier = getEfficiencyTier(efficiency);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Circle className="w-5 h-5 text-amber-400" />
          Dyson Sphere
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Efficiency Display */}
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Sphere Efficiency</span>
            <span className={cn('text-lg font-bold', efficiencyColor)}>{efficiency}%</span>
          </div>
          <Progress
            value={efficiency}
            className="h-2"
            aria-label="Dyson Sphere efficiency"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={efficiency}
          />
        </div>

        <TooltipProvider delayDuration={300}>
          {/* Unique Bonus: Unlimited Seeds */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 bg-purple-500/20 border border-purple-500/30 rounded cursor-help">
                <InfinityIcon className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm font-medium text-purple-300">Unlimited Seeds</div>
                  <div className="text-xs text-slate-400">No seed capacity limits</div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] text-center">
              <p>
                The Dyson Sphere provides unlimited energy, removing all seed capacity restrictions.
                Plant as many seeds as you want!
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Multipliers Based on Efficiency */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-slate-700/30 rounded p-2 cursor-help">
                  <div className="text-slate-500 text-xs">Production</div>
                  <div className="font-medium text-emerald-400">+{Math.round(efficiency * 2)}%</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-center">
                <p>
                  Production bonus scales with sphere efficiency. At 100%, you get +200% production.
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-slate-700/30 rounded p-2 cursor-help">
                  <div className="text-slate-500 text-xs">Export Bonus</div>
                  <div className="font-medium text-amber-400">+{Math.round(efficiency * 1.5)}%</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-center">
                <p>
                  Export bonus scales with sphere efficiency. At 100%, you get +150% export value.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Active Construction Projects */}
        {activeProjects.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-medium uppercase">Active Projects</div>
            {activeProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Next Upgrade Available */}
        {nextUpgrade && (
          <div className="border-t border-slate-700 pt-2">
            <div className="text-xs text-slate-400 mb-1">Next Efficiency Upgrade</div>
            <div className="bg-slate-700/30 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  Upgrade to <span className="text-amber-400">{nextUpgrade.efficiency}%</span>
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Cost: {nextUpgrade.crystals.toLocaleString()} crystals
                {nextUpgrade.transcendencePoints > 0 && ` + ${nextUpgrade.transcendencePoints} TP`}
              </div>
            </div>
          </div>
        )}

        {/* Max Efficiency Reached */}
        {efficiency >= 100 && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 p-2 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 text-sm"
          >
            <Check className="w-4 h-4" />
            <span>Maximum Efficiency Reached!</span>
          </div>
        )}

        {/* Efficiency Levels Reference */}
        <div className="text-xs text-slate-500">
          <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
            {(['minimal', 'low', 'medium', 'high', 'maximum'] as EfficiencyTier[]).map(tier => (
              <div
                key={tier}
                className={cn('text-center', tier === currentTier && 'text-slate-300 font-medium')}
              >
                <div>{EFFICIENCY_DISPLAY[tier].label}</div>
                <div className={EFFICIENCY_DISPLAY[tier].color}>
                  {EFFICIENCY_DISPLAY[tier].range}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Progress */}
        <div className="text-xs text-slate-500 border-t border-slate-700 pt-2">
          <div className="flex justify-between">
            <span>Upgrades Completed</span>
            <span>
              {completedUpgrades.length} / {DYSON_EFFICIENCY_COSTS.length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DysonSystemStatus;
