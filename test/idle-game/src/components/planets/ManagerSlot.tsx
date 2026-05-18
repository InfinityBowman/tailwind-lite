/**
 * Manager Slot Component
 * Shows the manager assigned to a planet with option to change
 */

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { useGame } from '../../contexts/GameEngineContext';
import {
  MANAGER_TEMPLATES,
  MANAGER_RARITY_CONFIG,
  calculateManagerPower,
} from '../../game/config/managers';
import { isManagersUnlocked } from '../../game/systems/ResearchSystem';
import type { ManagerInstance } from '../../game/systems/ManagerSystem';
import { getManagerForPlanet } from '../../game/systems/ManagerSystem';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getManagerIcon } from '../managers/managerIcons';
import { UserPlus, X, Lock } from 'lucide-react';

interface ManagerSlotProps {
  planetId: string;
  planetName: string;
}

const ManagerSlot: React.FC<ManagerSlotProps> = ({ planetId, planetName }) => {
  const { state, assignManager, unassignManager } = useGame();
  const [showPicker, setShowPicker] = useState(false);

  // Check if managers are unlocked
  const managersUnlocked = isManagersUnlocked(state.research.completed);

  // Get assigned manager
  const assignedManager = getManagerForPlanet(state.managers, planetId);
  const template = assignedManager ? MANAGER_TEMPLATES[assignedManager.templateId] : null;
  const rarityConfig = template ? MANAGER_RARITY_CONFIG[template.rarity] : null;

  // Get icon component from explicit mapping
  const IconComponent = template ? getManagerIcon(template.icon) : UserPlus;

  // Calculate bonus if assigned
  const bonus =
    template && assignedManager ? calculateManagerPower(template, assignedManager.level) : 0;

  // Get available managers (not assigned to other planets)
  const availableManagers = state.managers.owned.filter(m => {
    const assignedPlanet = Object.entries(state.managers.assignments).find(
      ([_, instanceId]) => instanceId === m.instanceId
    );
    return !assignedPlanet || assignedPlanet[0] === planetId;
  });

  if (!managersUnlocked) {
    return (
      <Card className="bg-secondary/30 border-dashed border-slate-600/50">
        <CardContent className="p-2 flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-700/50">
            <Lock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500">Manager Slot</p>
            <p className="text-[10px] text-slate-600">Unlock via Research</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAssign = (manager: ManagerInstance) => {
    assignManager(manager.instanceId, planetId);
    setShowPicker(false);
  };

  const handleUnassign = () => {
    unassignManager(planetId);
  };

  return (
    <>
      <Card
        className={cn(
          'cursor-pointer hover:border-white/20 transition-all',
          assignedManager ? 'bg-secondary/50' : 'bg-secondary/30 border-dashed'
        )}
        onClick={() => setShowPicker(true)}
      >
        <CardContent className="p-2 flex items-center gap-2">
          <div
            className={cn(
              'p-1.5 rounded',
              assignedManager ? rarityConfig?.bgColor : 'bg-slate-700/50'
            )}
            style={assignedManager ? { color: rarityConfig?.color } : undefined}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            {assignedManager && template ? (
              <>
                <p className="text-xs font-medium truncate">{template.name}</p>
                <p className="text-[10px] text-green-400">+{Math.round(bonus * 100)}% bonus</p>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">No Manager</p>
                <p className="text-[10px] text-slate-500">Tap to assign</p>
              </>
            )}
          </div>

          {assignedManager && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={e => {
                e.stopPropagation();
                handleUnassign();
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Manager Picker Dialog */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Manager to {planetName}</DialogTitle>
            <DialogDescription>
              Select a manager to boost this planet's production.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
            {availableManagers.length === 0 ? (
              <p className="col-span-2 text-center text-sm text-slate-400 py-4">
                No managers available. Pull from the Manager Gacha!
              </p>
            ) : (
              availableManagers.map(manager => {
                const mTemplate = MANAGER_TEMPLATES[manager.templateId];
                const mRarity = MANAGER_RARITY_CONFIG[mTemplate.rarity];
                const MIcon = getManagerIcon(mTemplate.icon);
                const mBonus = calculateManagerPower(mTemplate, manager.level);
                const isAssignedHere = state.managers.assignments[planetId] === manager.instanceId;

                return (
                  <button
                    key={manager.instanceId}
                    onClick={() => handleAssign(manager)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border transition-all text-left',
                      isAssignedHere
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-white/10 hover:border-white/30 bg-secondary/50'
                    )}
                  >
                    <div
                      className={cn('p-1.5 rounded', mRarity.bgColor)}
                      style={{ color: mRarity.color }}
                    >
                      <MIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{mTemplate.name}</p>
                      <p className="text-xs text-slate-400">
                        Lv.{manager.level} • +{Math.round(mBonus * 100)}%
                      </p>
                    </div>
                    {isAssignedHere && <div className="text-green-400 text-xs">Assigned</div>}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManagerSlot;
