/**
 * Manager Card Component
 * Displays a single manager with their portrait, stats, and level
 */

import React from 'react';
import { cn } from '../../lib/utils';
import {
  MANAGER_TEMPLATES,
  MANAGER_RARITY_CONFIG,
  TEAM_COLORS,
  calculateManagerPower,
  getSkillLabel,
} from '../../game/config/managers';
import type { ManagerInstance } from '../../game/systems/ManagerSystem';
import { getManagerIcon, Sparkles } from './managerIcons';

interface ManagerCardProps {
  manager: ManagerInstance;
  isAssigned?: boolean;
  assignedPlanet?: string;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

const ManagerCard: React.FC<ManagerCardProps> = ({
  manager,
  isAssigned = false,
  assignedPlanet,
  onClick,
  selected = false,
  compact = false,
}) => {
  const template = MANAGER_TEMPLATES[manager.templateId];
  if (!template) return null;

  const rarityConfig = MANAGER_RARITY_CONFIG[template.rarity];
  const power = calculateManagerPower(template, manager.level);
  const awakeningProgress = Math.floor((manager.level / template.maxLevel) * 100);

  // Get the icon component from our explicit mapping
  const IconComponent = getManagerIcon(template.icon);

  // Build accessible label
  const ariaLabel = `${template.name}, ${template.rarity} rarity, level ${manager.level}${
    manager.isAwakened ? ', awakened' : ''
  }${isAssigned ? `, assigned to ${assignedPlanet}` : ''}`;

  if (compact) {
    return (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={selected}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg border transition-all',
          'hover:border-white/30',
          selected ? 'border-white/50 bg-white/10' : 'border-white/10 bg-slate-800/50',
          isAssigned && 'ring-2 ring-green-500/50'
        )}
      >
        <div
          className={cn('p-1.5 rounded-lg', rarityConfig.bgColor)}
          style={{ color: rarityConfig.color }}
        >
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-start text-left min-w-0">
          <span className="text-sm font-medium truncate max-w-[100px]">{template.name}</span>
          <span className="text-xs text-slate-400">Lv.{manager.level}</span>
        </div>
        {manager.isAwakened && <Sparkles className="w-4 h-4 text-yellow-400" aria-hidden="true" />}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={selected}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl border transition-all',
        'hover:border-white/30 hover:scale-[1.02]',
        'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        selected ? 'border-white/50 bg-white/10' : 'border-white/10 bg-slate-800/50',
        isAssigned && 'ring-2 ring-green-500/50'
      )}
    >
      {/* Rarity indicator */}
      <div
        className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium capitalize"
        style={{
          backgroundColor: `${rarityConfig.color}20`,
          color: rarityConfig.color,
        }}
      >
        {template.rarity}
      </div>

      {/* Awakened star */}
      {manager.isAwakened && (
        <div className="absolute top-2 left-2">
          <Sparkles className="w-5 h-5 text-yellow-400" aria-hidden="true" />
        </div>
      )}

      {/* Portrait */}
      <div
        className={cn('p-4 rounded-full mb-3', rarityConfig.bgColor)}
        style={{ color: rarityConfig.color }}
      >
        <IconComponent className="w-10 h-10" aria-hidden="true" />
      </div>

      {/* Name */}
      <span className="font-bold text-white mb-1">{template.name}</span>

      {/* Team badge */}
      <span
        className="text-xs capitalize mb-2 px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: `${TEAM_COLORS[template.team]}20`,
          color: TEAM_COLORS[template.team],
        }}
      >
        {template.team}
      </span>

      {/* Level */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-slate-300">Lv.{manager.level}</span>
        <span className="text-slate-500">/</span>
        <span className="text-sm text-slate-500">{template.maxLevel}</span>
      </div>

      {/* Awakening progress bar */}
      <div
        className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2"
        role="progressbar"
        aria-label="Awakening progress"
        aria-valuenow={awakeningProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-yellow-400 transition-all"
          style={{ width: `${awakeningProgress}%` }}
        />
      </div>

      {/* Primary skill */}
      <div className="text-xs text-green-400">
        +{Math.round(power * 100)}% {getSkillLabel(template.primarySkill.type)}
      </div>

      {/* Global secondary bonus (awakened only) */}
      {manager.isAwakened && template.globalSecondaryBonus && (
        <div className="text-xs text-yellow-400 mt-1" title="Global bonus - applies to ALL planets">
          +{Math.round(template.globalSecondaryBonus.value * 100)}%{' '}
          {getSkillLabel(template.globalSecondaryBonus.type)} (Global)
        </div>
      )}

      {/* Assignment indicator */}
      {isAssigned && assignedPlanet && (
        <div className="mt-2 px-2 py-1 bg-green-500/20 rounded text-xs text-green-400">
          Assigned to {assignedPlanet}
        </div>
      )}
    </button>
  );
};

export default ManagerCard;
