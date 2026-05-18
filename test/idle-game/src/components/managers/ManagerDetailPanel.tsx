/**
 * Manager Detail Panel
 * Shows selected manager details with equipment slots
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
import { RECIPES } from '../../game/config/recipes';
import type { ManagerInstance } from '../../game/systems/ManagerSystem';
import type { CraftingState } from '../../game/systems/CraftingSystem';
import { getManagerEquipment } from '../../game/systems/CraftingSystem';
import { getManagerIcon, Sparkles } from './managerIcons';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Package, Shield, X, ArrowRight } from 'lucide-react';

interface ManagerDetailPanelProps {
  manager: ManagerInstance;
  craftingState: CraftingState;
  onEquip: (itemId: string, managerId: string) => void;
  onUnequip: (itemId: string) => void;
  onClose: () => void;
  isAssigned?: boolean;
  assignedPlanet?: string;
}

const ManagerDetailPanel: React.FC<ManagerDetailPanelProps> = ({
  manager,
  craftingState,
  onEquip,
  onUnequip,
  onClose,
  isAssigned,
  assignedPlanet,
}) => {
  const template = MANAGER_TEMPLATES[manager.templateId];
  if (!template) return null;

  const rarityConfig = MANAGER_RARITY_CONFIG[template.rarity];
  const power = calculateManagerPower(template, manager.level);
  const IconComponent = getManagerIcon(template.icon);

  // Get equipment for this manager
  const { equipped, available } = getManagerEquipment(manager.instanceId, craftingState);

  // Get effect types that are already equipped
  const equippedEffectTypes = new Set(
    equipped.map(item => RECIPES[item.itemId]?.effectType).filter(Boolean)
  );

  return (
    <Card className="bg-slate-800/90 border-white/10">
      <CardHeader className="pb-3 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-2 top-2"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-4">
          {/* Manager portrait */}
          <div
            className={cn('p-4 rounded-full', rarityConfig.bgColor)}
            style={{ color: rarityConfig.color }}
          >
            <IconComponent className="w-10 h-10" />
          </div>

          <div>
            <CardTitle className="flex items-center gap-2">
              {template.name}
              {manager.isAwakened && <Sparkles className="w-5 h-5 text-yellow-400" />}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs capitalize px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${rarityConfig.color}20`,
                  color: rarityConfig.color,
                }}
              >
                {template.rarity}
              </span>
              <span
                className="text-xs capitalize px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${TEAM_COLORS[template.team]}20`,
                  color: TEAM_COLORS[template.team],
                }}
              >
                {template.team}
              </span>
              <span className="text-sm text-slate-400">
                Lv.{manager.level}/{template.maxLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Primary skill */}
        <div className="mt-3 text-sm text-green-400">
          +{Math.round(power * 100)}% {getSkillLabel(template.primarySkill.type)}
        </div>

        {/* Assignment status */}
        {isAssigned && assignedPlanet && (
          <div className="mt-2 px-2 py-1 bg-green-500/20 rounded text-xs text-green-400 inline-flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Assigned to {assignedPlanet}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Equipment Section */}
        <div className="border-t border-white/10 pt-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" />
            Equipment
          </h3>

          {equipped.length === 0 && available.length === 0 ? (
            <p className="text-sm text-slate-400">
              No equipment available. Craft equipment in the Workshop!
            </p>
          ) : (
            <div className="space-y-3">
              {/* Currently equipped */}
              {equipped.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Equipped</p>
                  {equipped.map(item => {
                    const recipe = RECIPES[item.itemId];
                    if (!recipe) return null;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg border border-purple-500/30"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{recipe.name}</p>
                          <p className="text-xs text-green-400">
                            +{Math.round((recipe.effectValue || 0) * 100)}% {recipe.effectType}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnequip(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Unequip
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Available equipment */}
              {available.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Available to Equip
                  </p>
                  {available.map(item => {
                    const recipe = RECIPES[item.itemId];
                    if (!recipe) return null;

                    // Check if this effect type is already equipped
                    const alreadyHasType = equippedEffectTypes.has(recipe.effectType);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg border border-white/10"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{recipe.name}</p>
                          <p className="text-xs text-slate-400">
                            +{Math.round((recipe.effectValue || 0) * 100)}% {recipe.effectType}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEquip(item.id, manager.instanceId)}
                          disabled={alreadyHasType}
                          className={cn(alreadyHasType && 'opacity-50 cursor-not-allowed')}
                          title={
                            alreadyHasType
                              ? `Already has ${recipe.effectType} equipment`
                              : undefined
                          }
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Equip
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ManagerDetailPanel;
