/**
 * Trade Route Panel Component
 *
 * Displays and manages trade routes including:
 * - List of active trade routes
 * - Create new route form
 * - Delete route functionality
 *
 * @see GalaxyMapPanel.tsx for the parent container
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route, ArrowRight } from 'lucide-react';
import type { StarSystem } from '../../game/systems/StarSystemsSystem';

export interface TradeRoute {
  id: string;
  sourceSystem: string;
  destinationSystem: string;
  resourceType: string;
  level: number;
  active: boolean;
}

export interface TradeRoutePanelProps {
  routes: TradeRoute[];
  systems: Record<string, StarSystem>;
  maxRoutes: number;
  onCreateRoute: (source: string, dest: string, type: 'credits' | 'essence') => void;
  onDeleteRoute: (routeId: string) => void;
}

export const TradeRoutePanel: React.FC<TradeRoutePanelProps> = ({
  routes,
  systems,
  maxRoutes,
  onCreateRoute,
  onDeleteRoute,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [newDest, setNewDest] = useState('');
  const [newType, setNewType] = useState<'credits' | 'essence'>('credits');

  const activeRoutes = routes.filter(r => r.active);
  const unlockedSystems = Object.values(systems).filter(s => s.unlocked);
  const canCreateMore = routes.length < maxRoutes;

  const handleCreate = () => {
    if (newSource && newDest && newSource !== newDest) {
      onCreateRoute(newSource, newDest, newType);
      setIsCreating(false);
      setNewSource('');
      setNewDest('');
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Route className="w-5 h-5 text-emerald-400" />
            Trade Routes
            <span className="text-xs text-slate-500 font-normal">
              ({routes.length}/{maxRoutes})
            </span>
          </CardTitle>
          {canCreateMore && unlockedSystems.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setIsCreating(!isCreating)}
            >
              {isCreating ? 'Cancel' : '+ New'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Create New Route Form */}
        {isCreating && (
          <div className="space-y-2 p-2 bg-slate-700/30 rounded border border-slate-600">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newSource}
                onChange={e => setNewSource(e.target.value)}
                className="text-xs bg-slate-700 border-slate-600 rounded px-2 py-1 text-white"
                aria-label="Source system"
              >
                <option value="">From...</option>
                {unlockedSystems.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={newDest}
                onChange={e => setNewDest(e.target.value)}
                className="text-xs bg-slate-700 border-slate-600 rounded px-2 py-1 text-white"
                aria-label="Destination system"
              >
                <option value="">To...</option>
                {unlockedSystems
                  .filter(s => s.id !== newSource)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2">
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as 'credits' | 'essence')}
                className="flex-1 text-xs bg-slate-700 border-slate-600 rounded px-2 py-1 text-white"
                aria-label="Resource type"
              >
                <option value="credits">Credits</option>
                <option value="essence">Essence</option>
              </select>
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={handleCreate}
                disabled={!newSource || !newDest || newSource === newDest}
              >
                Create
              </Button>
            </div>
          </div>
        )}

        {/* Routes List */}
        {activeRoutes.length === 0 ? (
          <p className="text-sm text-slate-500">No active trade routes</p>
        ) : (
          <div className="space-y-2">
            {activeRoutes.map(route => (
              <div
                key={route.id}
                className="flex items-center gap-2 text-sm bg-slate-700/50 rounded px-2 py-1 group"
              >
                <span className="text-slate-300 truncate">
                  {systems[route.sourceSystem]?.name || route.sourceSystem}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-slate-300 truncate">
                  {systems[route.destinationSystem]?.name || route.destinationSystem}
                </span>
                <span className="text-xs text-slate-500 capitalize">({route.resourceType})</span>
                <span className="ml-auto text-xs text-slate-500">Lv.{route.level}</span>
                <button
                  onClick={() => onDeleteRoute(route.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                  aria-label={`Delete route from ${systems[route.sourceSystem]?.name} to ${systems[route.destinationSystem]?.name}`}
                >
                  <span className="text-xs">X</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeRoutePanel;
