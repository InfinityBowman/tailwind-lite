/**
 * Current System Status Component
 *
 * Wrapper component that renders the appropriate system-specific status panel
 * based on the current star system type (binary, nebula, black hole, etc.).
 *
 * @see GalaxyMapPanel.tsx for the parent container
 */

import React from 'react';
import type {
  StarSystem,
  BinarySystemState,
  NebulaSystemState,
  BlackHoleSystemState,
  DysonSphereState,
} from '../../game/systems/StarSystemsSystem';
import { BinarySystemStatus } from './BinarySystemStatus';
import { NebulaSystemStatus } from './NebulaSystemStatus';
import { BlackHoleSystemStatus } from './BlackHoleSystemStatus';
import { DysonSystemStatus } from './DysonSystemStatus';

export interface CurrentSystemStatusProps {
  system: StarSystem | null;
}

/**
 * Wrapper component that renders the appropriate system-specific status panel
 * based on the current star system type.
 */
export const CurrentSystemStatus: React.FC<CurrentSystemStatusProps> = ({ system }) => {
  if (!system || !system.unlocked) return null;

  // Render system-specific status based on type
  switch (system.type) {
    case 'binary':
      if (system.uniqueState && 'phase' in system.uniqueState) {
        return <BinarySystemStatus binaryState={system.uniqueState as BinarySystemState} />;
      }
      return null;

    case 'nebula':
      if (system.uniqueState && 'density' in system.uniqueState) {
        return <NebulaSystemStatus nebulaState={system.uniqueState as NebulaSystemState} />;
      }
      return null;

    case 'blackhole':
      if (system.uniqueState && 'planetStability' in system.uniqueState) {
        return (
          <BlackHoleSystemStatus blackHoleState={system.uniqueState as BlackHoleSystemState} />
        );
      }
      return null;

    case 'dyson':
      if (system.uniqueState && 'efficiency' in system.uniqueState) {
        return <DysonSystemStatus dysonState={system.uniqueState as DysonSphereState} />;
      }
      return null;

    default:
      return null;
  }
};

export default CurrentSystemStatus;
