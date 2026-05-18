/**
 * Expedition Setup Component
 * Dialog for configuring and launching an expedition
 */

import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import {
  Rocket,
  Clock,
  Target,
  Plus,
  X,
  Coins,
  Gem,
  Leaf,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Package,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import {
  EXPEDITION_TYPES,
  EXPEDITION_CONFIG,
  formatExpeditionDuration,
  isExpeditionUnlocked,
  type ExpeditionTypeId,
} from '../../game/config/expeditions';
import {
  calculateSuccessRate,
  getBusyManagerIds,
  type ExpeditionState,
} from '../../game/systems/ExpeditionSystem';
import type { ManagerInstance, ManagerState } from '../../game/systems/ManagerSystem';
import {
  MANAGER_TEMPLATES,
  MANAGER_RARITY_CONFIG,
  calculateManagerPower,
  getSkillLabel,
} from '../../game/config/managers';
import { getManagerIcon } from '../managers/managerIcons';
import { type CraftingState, combineSupplyEffects } from '../../game/systems/CraftingSystem';
import { RECIPES } from '../../game/config/recipes';
import SupplySelector from './SupplySelector';

interface ExpeditionSetupProps {
  open: boolean;
  onClose: () => void;
  onLaunch: (typeId: ExpeditionTypeId, managerIds: string[], supplyIds?: string[]) => void;
  expeditionState: ExpeditionState;
  managerState: ManagerState;
  craftingState?: CraftingState;
}

const ExpeditionSetup: React.FC<ExpeditionSetupProps> = ({
  open,
  onClose,
  onLaunch,
  expeditionState,
  managerState,
  craftingState,
}) => {
  const [selectedTypeId, setSelectedTypeId] = useState<ExpeditionTypeId>('survey');
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [selectedSupplyIds, setSelectedSupplyIds] = useState<string[]>([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const selectedType = EXPEDITION_TYPES[selectedTypeId];

  // Get available managers (not on expedition)
  const busyManagerIds = useMemo(() => getBusyManagerIds(expeditionState), [expeditionState]);

  const availableManagers = useMemo(() => {
    return managerState.owned.filter(m => !busyManagerIds.has(m.instanceId));
  }, [managerState.owned, busyManagerIds]);

  const selectedManagers = useMemo(() => {
    return selectedManagerIds
      .map(id => managerState.owned.find(m => m.instanceId === id))
      .filter(Boolean) as ManagerInstance[];
  }, [selectedManagerIds, managerState.owned]);

  // Calculate success rate
  const successRate = useMemo(() => {
    if (selectedManagers.length === 0) return selectedType.baseSuccessRate;
    return calculateSuccessRate(selectedTypeId, selectedManagers);
  }, [selectedTypeId, selectedManagers, selectedType.baseSuccessRate]);

  // Calculate supply effects
  const supplyEffects = useMemo(() => {
    if (!craftingState || selectedSupplyIds.length === 0) return {} as Record<string, number>;

    const effects: Array<{
      effectType:
        | 'expeditionTime'
        | 'expeditionRewards'
        | 'seedProtectionChance'
        | 'legendaryChance';
      effectValue: number;
    }> = [];

    for (const id of selectedSupplyIds) {
      const supply = craftingState.inventory.find(i => i.id === id);
      if (!supply) continue;
      const recipe = RECIPES[supply.itemId];
      if (!recipe || !recipe.effectType || !recipe.effectValue) continue;

      // Only include supply effect types
      const effectType = recipe.effectType;
      if (
        effectType === 'expeditionTime' ||
        effectType === 'expeditionRewards' ||
        effectType === 'seedProtectionChance' ||
        effectType === 'legendaryChance'
      ) {
        effects.push({ effectType, effectValue: recipe.effectValue });
      }
    }

    return combineSupplyEffects(effects);
  }, [craftingState, selectedSupplyIds]);

  // Calculate adjusted duration with supply effects
  const adjustedDuration = useMemo(() => {
    const baseTime = selectedType.durationMs;
    const timeReduction = supplyEffects.expeditionTime || 0;
    return Math.floor(baseTime * (1 - timeReduction));
  }, [selectedType.durationMs, supplyEffects]);

  // Validation
  const canLaunch =
    selectedManagerIds.length >= selectedType.minManagers &&
    selectedManagerIds.length <= selectedType.maxManagers;

  const handleSelectManager = (managerId: string) => {
    if (selectedManagerIds.includes(managerId)) {
      setSelectedManagerIds(prev => prev.filter(id => id !== managerId));
    } else if (selectedManagerIds.length < selectedType.maxManagers) {
      setSelectedManagerIds(prev => [...prev, managerId]);
    }
  };

  const handleLaunch = () => {
    if (canLaunch) {
      onLaunch(
        selectedTypeId,
        selectedManagerIds,
        selectedSupplyIds.length > 0 ? selectedSupplyIds : undefined
      );
      setSelectedManagerIds([]);
      setSelectedSupplyIds([]);
      onClose();
    }
  };

  const handleToggleSupply = (supplyId: string) => {
    setSelectedSupplyIds(prev =>
      prev.includes(supplyId) ? prev.filter(id => id !== supplyId) : [...prev, supplyId]
    );
  };

  const handleTypeSelect = (typeId: ExpeditionTypeId) => {
    setSelectedTypeId(typeId);
    setShowTypeDropdown(false);
    // Clear managers if they exceed new max
    if (selectedManagerIds.length > EXPEDITION_TYPES[typeId].maxManagers) {
      setSelectedManagerIds(prev => prev.slice(0, EXPEDITION_TYPES[typeId].maxManagers));
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-400" />
            Launch Expedition
          </DialogTitle>
          <DialogDescription>
            Select an expedition type and assign managers to send on a mission.
          </DialogDescription>
        </DialogHeader>

        {/* Expedition Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Expedition Type</label>
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-white/10 bg-slate-800/50 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <div className="font-medium">{selectedType.name}</div>
                  <div className="text-sm text-slate-400">{selectedType.description}</div>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-slate-400 transition-transform',
                  showTypeDropdown && 'rotate-180'
                )}
              />
            </button>

            {showTypeDropdown && (
              <div className="absolute z-10 w-full mt-1 rounded-lg border border-white/10 bg-slate-800 shadow-xl">
                {Object.values(EXPEDITION_TYPES).map(type => {
                  const isUnlocked = isExpeditionUnlocked(type.id, expeditionState.completed);
                  return (
                    <button
                      key={type.id}
                      onClick={() => isUnlocked && handleTypeSelect(type.id)}
                      disabled={!isUnlocked}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 text-left transition-all',
                        'first:rounded-t-lg last:rounded-b-lg',
                        isUnlocked ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed',
                        selectedTypeId === type.id && 'bg-white/10'
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{type.name}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatExpeditionDuration(type.durationMs)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400">{type.description}</div>
                        {!isUnlocked && type.unlockRequirement && (
                          <div className="text-xs text-yellow-500 mt-1">
                            Requires {type.unlockRequirement.level} expeditions completed
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        {Math.round(type.baseSuccessRate * 100)}% base
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Manager Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">
              Select Managers ({selectedManagerIds.length}/{selectedType.maxManagers})
            </label>
            <span className="text-xs text-slate-500">Min: {selectedType.minManagers}</span>
          </div>

          {/* Selected managers slots */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {Array.from({ length: selectedType.maxManagers }).map((_, i) => {
              const manager = selectedManagers[i];
              if (manager) {
                const template = MANAGER_TEMPLATES[manager.templateId];
                const IconComponent = getManagerIcon(template?.icon || 'User');
                const rarityConfig = MANAGER_RARITY_CONFIG[template?.rarity || 'common'];

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectManager(manager.instanceId)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-white/20 bg-slate-700/50 hover:bg-slate-700 transition-all"
                  >
                    <div
                      className="p-1.5 rounded-lg"
                      style={{
                        backgroundColor: `${rarityConfig.color}20`,
                        color: rarityConfig.color,
                      }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-medium truncate">{template?.name}</div>
                      <div className="text-xs text-slate-400">Lv.{manager.level}</div>
                    </div>
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                );
              }

              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center justify-center p-4 rounded-lg border-2 border-dashed',
                    i < selectedType.minManagers
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-white/10 bg-slate-800/30'
                  )}
                >
                  <Plus className="w-5 h-5 text-slate-500" />
                </div>
              );
            })}
          </div>

          {/* Available managers list */}
          <div className="max-h-[200px] overflow-y-auto rounded-lg border border-white/10 bg-slate-800/30">
            {availableManagers.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                No managers available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 p-2">
                {availableManagers.map(manager => {
                  const template = MANAGER_TEMPLATES[manager.templateId];
                  if (!template) return null;

                  const IconComponent = getManagerIcon(template.icon);
                  const rarityConfig = MANAGER_RARITY_CONFIG[template.rarity];
                  const isSelected = selectedManagerIds.includes(manager.instanceId);
                  const power = calculateManagerPower(template, manager.level);

                  return (
                    <button
                      key={manager.instanceId}
                      onClick={() => handleSelectManager(manager.instanceId)}
                      disabled={
                        !isSelected && selectedManagerIds.length >= selectedType.maxManagers
                      }
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg transition-all',
                        isSelected
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'hover:bg-white/5 border border-transparent',
                        !isSelected &&
                          selectedManagerIds.length >= selectedType.maxManagers &&
                          'opacity-50'
                      )}
                    >
                      <div
                        className="p-1.5 rounded-lg"
                        style={{
                          backgroundColor: `${rarityConfig.color}20`,
                          color: rarityConfig.color,
                        }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium truncate">{template.name}</div>
                        <div className="text-xs text-slate-400">
                          +{Math.round(power * 100)}% {getSkillLabel(template.primarySkill.type)}
                        </div>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Supply Selection */}
        {craftingState && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Expedition Supplies
            </label>
            <SupplySelector
              craftingState={craftingState}
              selectedSupplyIds={selectedSupplyIds}
              onToggleSupply={handleToggleSupply}
              maxSupplies={EXPEDITION_CONFIG.MAX_SUPPLIES_PER_EXPEDITION}
            />
          </div>
        )}

        {/* Stats Preview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Target className="w-4 h-4" />
              Success Rate
            </div>
            <div className="text-2xl font-bold text-white">{Math.round(successRate * 100)}%</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Clock className="w-4 h-4" />
              Duration
            </div>
            <div className="text-2xl font-bold text-white">
              {formatExpeditionDuration(adjustedDuration)}
              {supplyEffects.expeditionTime && (
                <span className="text-sm text-emerald-400 ml-1">
                  (-{Math.round(supplyEffects.expeditionTime * 100)}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expected Rewards */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Expected Rewards</h4>
          <div className="flex flex-wrap gap-2">
            {selectedType.rewards.map((reward, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/50 border border-white/10 text-sm"
              >
                {reward.type === 'credits' && <Coins className="w-4 h-4 text-yellow-400" />}
                {reward.type === 'crystals' && <Gem className="w-4 h-4 text-purple-400" />}
                {reward.type === 'seeds' && <Leaf className="w-4 h-4 text-green-400" />}
                {reward.type === 'fragments' && <Gem className="w-4 h-4 text-blue-400" />}
                <span className="text-slate-300">
                  {reward.min}-{reward.max} {reward.type}
                  {reward.rarity && ` (${reward.rarity})`}
                </span>
                <span className="text-slate-500">({Math.round(reward.chance * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Launch Button */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleLaunch}
            disabled={!canLaunch}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Rocket className="w-4 h-4" />
            Launch Expedition
          </Button>
        </div>

        {!canLaunch && selectedManagerIds.length < selectedType.minManagers && (
          <p className="text-center text-sm text-yellow-500 mt-2">
            Select at least {selectedType.minManagers} manager
            {selectedType.minManagers > 1 ? 's' : ''} to launch
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExpeditionSetup;
