/**
 * Manager List Component
 * Grid display of all owned managers with filtering options
 */

import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import {
  ManagerRarity,
  ManagerTeam,
  MANAGER_TEMPLATES,
  MANAGER_RARITY_CONFIG,
} from '../../game/config/managers';
import type { ManagerState, ManagerInstance } from '../../game/systems/ManagerSystem';
import { getCollectionStats } from '../../game/systems/ManagerSystem';
import ManagerCard from './ManagerCard';
import { Filter, Users, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ManagerListProps {
  managerState: ManagerState;
  crystals: number; // From ship.crystals
  onSelectManager?: (manager: ManagerInstance) => void;
  selectedManagerId?: string;
  showFilters?: boolean;
}

type SortOption = 'rarity' | 'level' | 'name' | 'recent';
type FilterOption = 'all' | ManagerRarity | ManagerTeam;

const RARITY_ORDER: Record<ManagerRarity, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

const ManagerList: React.FC<ManagerListProps> = ({
  managerState,
  crystals,
  onSelectManager,
  selectedManagerId,
  showFilters = true,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('rarity');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const stats = useMemo(() => getCollectionStats(managerState), [managerState]);

  // Sort and filter managers
  const displayedManagers = useMemo(() => {
    let managers = [...managerState.owned];

    // Filter
    if (filterBy !== 'all') {
      managers = managers.filter(m => {
        const template = MANAGER_TEMPLATES[m.templateId];
        if (!template) return false;

        // Check if it's a rarity filter
        if (['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(filterBy)) {
          return template.rarity === filterBy;
        }

        // Check if it's a team filter
        return template.team === filterBy;
      });
    }

    // Sort
    managers.sort((a, b) => {
      const templateA = MANAGER_TEMPLATES[a.templateId];
      const templateB = MANAGER_TEMPLATES[b.templateId];

      if (!templateA || !templateB) return 0;

      switch (sortBy) {
        case 'rarity': {
          // Higher rarity first, then level
          const rarityDiff = RARITY_ORDER[templateB.rarity] - RARITY_ORDER[templateA.rarity];
          if (rarityDiff !== 0) return rarityDiff;
          return b.level - a.level;
        }
        case 'level':
          // Higher level first
          return b.level - a.level;

        case 'name':
          return templateA.name.localeCompare(templateB.name);

        case 'recent':
          return b.obtainedAt - a.obtainedAt;

        default:
          return 0;
      }
    });

    return managers;
  }, [managerState.owned, sortBy, filterBy]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white">
              {stats.owned}/{stats.total} Managers
            </span>
          </div>

          {stats.awakened > 0 && (
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">{stats.awakened} Awakened</span>
            </div>
          )}
        </div>

        {/* Crystal count */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg">
          <span className="text-purple-300 font-bold">{crystals.toLocaleString()}</span>
          <span className="text-purple-400 text-sm">Crystals</span>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />

          {/* Sort dropdown */}
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[160px] h-8 bg-slate-800 border-white/10 text-sm">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rarity">By Rarity</SelectItem>
              <SelectItem value="level">By Level</SelectItem>
              <SelectItem value="name">By Name</SelectItem>
              <SelectItem value="recent">Recently Obtained</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-1">
            <FilterButton active={filterBy === 'all'} onClick={() => setFilterBy('all')}>
              All
            </FilterButton>

            {/* Rarity filters */}
            {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as ManagerRarity[]).map(
              rarity => (
                <FilterButton
                  key={rarity}
                  active={filterBy === rarity}
                  onClick={() => setFilterBy(rarity)}
                  color={MANAGER_RARITY_CONFIG[rarity].color}
                  aria-label={`Filter by ${rarity} rarity`}
                >
                  {rarity.charAt(0).toUpperCase()}
                </FilterButton>
              )
            )}

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Team filters */}
            {(['farmer', 'trader', 'scholar', 'specialist', 'lucky'] as ManagerTeam[]).map(team => (
              <FilterButton key={team} active={filterBy === team} onClick={() => setFilterBy(team)}>
                {team.charAt(0).toUpperCase() + team.slice(1)}
              </FilterButton>
            ))}
          </div>
        </div>
      )}

      {/* Manager grid */}
      {displayedManagers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Users className="w-12 h-12 mb-4 opacity-50" />
          {managerState.owned.length === 0 ? (
            <>
              <p className="text-lg mb-2">No managers yet</p>
              <p className="text-sm">Pull from the Manager Gacha to get started!</p>
            </>
          ) : (
            <p>No managers match the current filter</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayedManagers.map(manager => (
            <ManagerCard
              key={manager.instanceId}
              manager={manager}
              isAssigned={Object.values(managerState.assignments).includes(manager.instanceId)}
              onClick={() => onSelectManager?.(manager)}
              selected={selectedManagerId === manager.instanceId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
  'aria-label'?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  active,
  onClick,
  children,
  color,
  'aria-label': ariaLabel,
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    aria-label={ariaLabel}
    className={cn(
      'px-2 py-0.5 rounded text-xs font-medium transition-colors',
      'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
      active ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
    )}
    style={color ? { color: active ? color : undefined } : undefined}
  >
    {children}
  </button>
);

export default ManagerList;
