/**
 * Galaxy Map Panel
 *
 * Main UI for the Star Systems feature. Shows:
 * - Visual galaxy map with star systems
 * - Current ship location and travel status
 * - System details and unlock requirements
 * - Trade routes management
 *
 * @see src/game/core/handlers/StarSystemsHandler.ts for business logic
 */

import React, { useState, useCallback } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { useToast } from '@/components/ui/ToastProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Orbit } from 'lucide-react';
import type { StarSystem } from '../../game/systems/StarSystemsSystem';
import { StarSystemCard } from './StarSystemCard';
import { ShipPanel } from './ShipPanel';
import { TradeRoutePanel } from './TradeRoutePanel';
import { CurrentSystemStatus } from './CurrentSystemStatus';

export const GalaxyMapPanel: React.FC = () => {
  const {
    getStarSystemsState,
    isGalaxyMapUnlocked,
    startTravel,
    getShipUpgradeCost,
    upgradeShip,
    unloadCargo,
    createTradeRoute,
    deleteTradeRoute,
    state,
  } = useGame();
  const { addToast } = useToast();
  const [_selectedSystem, setSelectedSystem] = useState<string | null>(null);

  // Get star systems data (needed for travel success message)
  const starSystemsState = getStarSystemsState();
  const upgradeCost = getShipUpgradeCost();
  const canAffordUpgrade = upgradeCost !== null && state.ship.totalCurrency >= upgradeCost;

  // All hooks must be called before any early returns
  const handleTravel = useCallback(
    async (systemId: string) => {
      const result = await startTravel(systemId);
      if (!result.success) {
        addToast(result.error || 'Unable to start travel', 'error');
      } else {
        const systemName = starSystemsState?.systems[systemId]?.name || systemId;
        addToast(`Traveling to ${systemName}...`, 'info');
      }
    },
    [startTravel, addToast, starSystemsState]
  );

  const handleSelectSystem = useCallback((systemId: string) => {
    setSelectedSystem(prev => (systemId === prev ? null : systemId));
  }, []);

  const handleUpgradeShip = useCallback(async () => {
    const result = await upgradeShip();
    if (result.success) {
      addToast('Ship upgraded! Faster travel and more cargo space.', 'success');
    } else {
      addToast(result.error || 'Cannot upgrade ship', 'error');
    }
  }, [upgradeShip, addToast]);

  const handleUnloadCargo = useCallback(async () => {
    const result = await unloadCargo();
    if (result.success && result.cargo && result.cargo.length > 0) {
      addToast(`Unloaded ${result.cargo.length} seeds from cargo`, 'info');
    }
  }, [unloadCargo, addToast]);

  const handleCreateTradeRoute = useCallback(
    async (source: string, dest: string, resourceType: 'credits' | 'essence') => {
      const result = await createTradeRoute(source, dest, resourceType);
      if (result.success) {
        addToast('Trade route created!', 'success');
      } else {
        addToast(result.error || 'Failed to create trade route', 'error');
      }
    },
    [createTradeRoute, addToast]
  );

  const handleDeleteTradeRoute = useCallback(
    async (routeId: string) => {
      const result = await deleteTradeRoute(routeId);
      if (result.success) {
        addToast('Trade route deleted', 'info');
      }
    },
    [deleteTradeRoute, addToast]
  );

  const isUnlocked = isGalaxyMapUnlocked();

  // If galaxy map not unlocked, show locked state
  if (!isUnlocked) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12 text-center">
          <Lock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Galaxy Map Locked</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Complete your first Transcendence to unlock interstellar travel and discover new star
            systems.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Safe access to state
  const systems = starSystemsState?.systems ?? {};
  const ship = starSystemsState?.ship ?? {
    currentSystem: 'home',
    destinationSystem: null,
    travelStartTime: null,
    travelDuration: 0,
    cargo: [],
    maxCargo: 10,
    upgradeLevel: 1,
  };
  const tradeRoutes = starSystemsState?.tradeRoutes ?? [];

  const systemList = Object.values(systems) as StarSystem[];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Orbit className="w-6 h-6 text-blue-400" />
            Galaxy Map
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Systems List */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Star Systems
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {systemList.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500">
                No star systems available. Progress further to discover new systems.
              </div>
            ) : (
              systemList.map(system => (
                <StarSystemCard
                  key={system.id}
                  system={system}
                  isCurrentLocation={ship.currentSystem === system.id}
                  isTravelDestination={ship.destinationSystem === system.id}
                  ship={ship}
                  onSelect={handleSelectSystem}
                  onTravel={handleTravel}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ShipPanel
            ship={ship}
            systems={systems}
            onUpgradeShip={handleUpgradeShip}
            onUnloadCargo={handleUnloadCargo}
            canUpgrade={canAffordUpgrade}
            upgradeCost={upgradeCost}
          />
          <CurrentSystemStatus system={ship.currentSystem ? systems[ship.currentSystem] : null} />
          <TradeRoutePanel
            routes={tradeRoutes}
            systems={systems}
            maxRoutes={starSystemsState?.maxTradeRoutes ?? 3}
            onCreateRoute={handleCreateTradeRoute}
            onDeleteRoute={handleDeleteTradeRoute}
          />
        </div>
      </div>
    </div>
  );
};

export default GalaxyMapPanel;
