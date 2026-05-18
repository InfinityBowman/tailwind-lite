/**
 * Star Systems - Galaxy Map & Multi-System Gameplay
 *
 * Transforms the game from managing a single planetary cluster into
 * commanding an interstellar farming empire.
 *
 * Systems:
 * - Home System: Standard 9 planets (current game)
 * - Binary System: Day/night cycle, double exports
 * - Nebula Cluster: 3x refinement, reduced sell value
 * - Black Hole System: 10x production, instability risk
 * - Dyson Sphere: Unlimited seeds, ultimate endgame
 *
 * @see docs/33_STAR_SYSTEMS_DESIGN.md for full design
 */

// ============================================
// STAR SYSTEM TYPES
// ============================================

export type StarSystemType = 'home' | 'binary' | 'nebula' | 'blackhole' | 'dyson';

export type BinaryPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface UnlockRequirement {
  type: 'ascensionLevel' | 'prestigePoints' | 'legendaryManagers' | 'systemMastery';
  value: number;
  systemId?: string; // For systemMastery requirement
}

// ============================================
// SYSTEM-SPECIFIC STATE
// ============================================

/**
 * Binary System: Day/night cycle with solar flares
 */
export interface BinarySystemState {
  /** Current phase of the day/night cycle */
  phase: BinaryPhase;
  /** Timestamp when current phase started */
  phaseStartTime: number;
  /** Whether a solar flare is currently active */
  solarFlareActive: boolean;
  /** Timestamp when solar flare started (if active) */
  solarFlareStartTime: number | null;
  /** Cargo stored in solar silo during flare */
  solarSiloCargo: number;
}

/**
 * Nebula Cluster: Essence-focused with density mechanic
 */
export interface NebulaSystemState {
  /** Current nebula density (0-100) */
  density: number;
  /** Number of essence crystals available to collect */
  crystalsAvailable: number;
  /** Timestamp of last crystal spawn */
  lastCrystalSpawn: number;
}

/**
 * Black Hole System: High risk/reward with stability
 */
export interface BlackHoleSystemState {
  /** Stability percentage per planet (0-100) */
  planetStability: Record<string, number>;
  /** Whether Event Horizon state is active */
  eventHorizonActive: boolean;
  /** Planets that have collapsed and need re-purchase */
  collapsedPlanets: string[];
}

/**
 * Dyson Sphere: Ultimate endgame
 */
export interface DysonSphereState {
  /** Current efficiency level (0-100) */
  efficiency: number;
  /** Active construction projects */
  activeProjects: ConstructionProject[];
  /** Completed efficiency upgrades */
  completedUpgrades: number[];
}

export interface ConstructionProject {
  id: string;
  name: string;
  /** Daily credit cost */
  dailyCost: number;
  /** Total days required */
  totalDays: number;
  /** Days of progress made */
  progressDays: number;
  /** Timestamp of last contribution (ms since epoch) */
  lastContributionTime: number | null;
  /** Whether project is complete */
  complete: boolean;
}

// ============================================
// TRAVEL SHIP
// ============================================

export interface TravelShip {
  /** Current system location (null if traveling) */
  currentSystem: string | null;
  /** Destination system (null if not traveling) */
  destinationSystem: string | null;
  /** Timestamp when travel started */
  travelStartTime: number | null;
  /** Total travel duration in ms */
  travelDuration: number;
  /** Seeds being transported */
  cargo: string[]; // Seed instance IDs
  /** Maximum cargo capacity */
  maxCargo: number;
  /** Ship upgrade level (affects travel time and cargo) */
  upgradeLevel: number;
}

// ============================================
// TRADE ROUTES
// ============================================

export type TradeResourceType = 'credits' | 'essence';

export interface TradeRoute {
  id: string;
  /** Source system ID */
  sourceSystem: string;
  /** Destination system ID */
  destinationSystem: string;
  /** Type of resource being traded */
  resourceType: TradeResourceType;
  /** Route upgrade level (1-5) */
  level: number;
  /** Assigned manager ID (null if none) */
  assignedManager: string | null;
  /** Calculated efficiency percentage */
  efficiency: number;
  /** Whether route is active */
  active: boolean;
}

// ============================================
// STAR SYSTEM DATA
// ============================================

export interface StarSystem {
  id: string;
  name: string;
  type: StarSystemType;
  /** Whether system is unlocked */
  unlocked: boolean;
  /** Requirements to unlock */
  unlockRequirements: UnlockRequirement[];
  /** Planet IDs in this system */
  planetIds: string[];
  /** Mastery challenge progress (0-100) */
  masteryProgress: number;
  /** Whether mastery is complete */
  masteryComplete: boolean;
  /** System-specific state */
  uniqueState:
    | BinarySystemState
    | NebulaSystemState
    | BlackHoleSystemState
    | DysonSphereState
    | null;
}

// ============================================
// COMPLETE STAR SYSTEMS STATE
// ============================================

export interface StarSystemsState {
  /** Whether galaxy map is unlocked (requires Ascension 1) */
  galaxyMapUnlocked: boolean;
  /** All star systems */
  systems: Record<string, StarSystem>;
  /** Travel ship state */
  ship: TravelShip;
  /** Active trade routes */
  tradeRoutes: TradeRoute[];
  /** Maximum trade routes allowed */
  maxTradeRoutes: number;
  /** Active synergy bonuses */
  activeSynergies: string[];
}

// ============================================
// CONSTANTS
// ============================================

/** Phase durations in milliseconds */
export const BINARY_PHASE_DURATIONS: Record<BinaryPhase, number> = {
  dawn: 2 * 60 * 1000, // 2 minutes
  day: 6 * 60 * 1000, // 6 minutes
  dusk: 2 * 60 * 1000, // 2 minutes
  night: 10 * 60 * 1000, // 10 minutes
};

/** Full cycle duration */
export const BINARY_FULL_CYCLE_MS = Object.values(BINARY_PHASE_DURATIONS).reduce(
  (sum, d) => sum + d,
  0
);

/** Solar flare interval (4 hours) */
export const SOLAR_FLARE_INTERVAL_MS = 4 * 60 * 60 * 1000;

/** Solar flare duration (5 minutes) */
export const SOLAR_FLARE_DURATION_MS = 5 * 60 * 1000;

/** Travel times between systems (in ms) - base values */
export const BASE_TRAVEL_TIMES: Record<string, Record<string, number>> = {
  home: {
    binary: 15 * 60 * 1000, // 15 min
    nebula: 30 * 60 * 1000, // 30 min
    blackhole: 60 * 60 * 1000, // 60 min
    dyson: 2 * 60 * 60 * 1000, // 2 hours
  },
  binary: {
    home: 15 * 60 * 1000,
    nebula: 20 * 60 * 1000,
    blackhole: 45 * 60 * 1000,
    dyson: 2 * 60 * 60 * 1000,
  },
  nebula: {
    home: 30 * 60 * 1000,
    binary: 20 * 60 * 1000,
    blackhole: 40 * 60 * 1000,
    dyson: 2 * 60 * 60 * 1000,
  },
  blackhole: {
    home: 60 * 60 * 1000,
    binary: 45 * 60 * 1000,
    nebula: 40 * 60 * 1000,
    dyson: 2 * 60 * 60 * 1000,
  },
  dyson: {
    home: 2 * 60 * 60 * 1000,
    binary: 2 * 60 * 60 * 1000,
    nebula: 2 * 60 * 60 * 1000,
    blackhole: 2 * 60 * 60 * 1000,
  },
};

/** Trade route upgrade costs */
export const TRADE_ROUTE_UPGRADE_COSTS: Record<number, number> = {
  1: 1000,
  2: 10000,
  3: 100000,
  4: 1000000,
  5: 10000000,
};

/** Trade route efficiency by level */
export const TRADE_ROUTE_EFFICIENCY: Record<number, number> = {
  1: 0.1, // 10%
  2: 0.15, // 15%
  3: 0.2, // 20%
  4: 0.3, // 30%
  5: 0.5, // 50%
};

/** Dyson Sphere efficiency upgrade costs */
export const DYSON_EFFICIENCY_COSTS: Array<{
  efficiency: number;
  crystals: number;
  transcendencePoints: number;
}> = [
  { efficiency: 10, crystals: 1000, transcendencePoints: 0 },
  { efficiency: 25, crystals: 10000, transcendencePoints: 0 },
  { efficiency: 50, crystals: 100000, transcendencePoints: 10 },
  { efficiency: 75, crystals: 1000000, transcendencePoints: 50 },
  { efficiency: 100, crystals: 10000000, transcendencePoints: 100 },
];

/** Ship cargo capacity */
export const SHIP_BASE_CARGO = 10;
export const SHIP_MAX_CARGO = 50;
export const SHIP_CARGO_PER_UPGRADE = 10;

/** Ship upgrade costs (credits) by current level */
export const SHIP_UPGRADE_COSTS: Record<number, number> = {
  0: 10000, // Upgrade from level 0 to 1
  1: 50000, // Upgrade from level 1 to 2
  2: 250000, // Upgrade from level 2 to 3
  3: 1000000, // Upgrade from level 3 to 4 (max cargo at 50)
};

/** Black hole stability change rates (per action) */
export const STABILITY_LOSS_PER_EXPORT = -1;
export const STABILITY_LOSS_SOLAR_FLARE = -5;
export const STABILITY_LOSS_EMPTY_PLANET = -10;
export const STABILITY_GAIN_PER_MINUTE = 0.1;
export const STABILITY_GAIN_MANAGER_SACRIFICE = 10;
export const STABILITY_GAIN_GRAVITATIONAL_ANCHOR = 25;

/** Nebula crystal spawn chance at Critical density (per minute) */
export const NEBULA_CRYSTAL_SPAWN_CHANCE = 0.05; // 5%

// ============================================
// SYSTEM DEFINITIONS
// ============================================

export const STAR_SYSTEM_DEFINITIONS: Record<string, Omit<StarSystem, 'uniqueState'>> = {
  home: {
    id: 'home',
    name: 'Home System',
    type: 'home',
    unlocked: true, // Always unlocked
    unlockRequirements: [],
    planetIds: ['green', 'blue', 'orange', 'purple', 'ice', 'desert', 'ocean', 'volcanic', 'void'],
    masteryProgress: 0,
    masteryComplete: false,
  },
  binary: {
    id: 'binary',
    name: 'Binary System',
    type: 'binary',
    unlocked: false,
    unlockRequirements: [{ type: 'ascensionLevel', value: 1 }],
    planetIds: ['solPrime', 'solSecundus', 'twilight', 'dawnsEdge', 'dusksEnd', 'eclipse'],
    masteryProgress: 0,
    masteryComplete: false,
  },
  nebula: {
    id: 'nebula',
    name: 'Nebula Cluster',
    type: 'nebula',
    unlocked: false,
    unlockRequirements: [
      { type: 'ascensionLevel', value: 3 },
      { type: 'prestigePoints', value: 500 },
    ],
    planetIds: ['coreNebula', 'fringeWorld', 'researchStation', 'crystalline'],
    masteryProgress: 0,
    masteryComplete: false,
  },
  blackhole: {
    id: 'blackhole',
    name: 'Black Hole System',
    type: 'blackhole',
    unlocked: false,
    unlockRequirements: [
      { type: 'ascensionLevel', value: 5 },
      { type: 'legendaryManagers', value: 10 },
    ],
    planetIds: ['accretionPrime', 'temporalRefuge', 'singularitysEdge'],
    masteryProgress: 0,
    masteryComplete: false,
  },
  dyson: {
    id: 'dyson',
    name: 'Dyson Sphere',
    type: 'dyson',
    unlocked: false,
    unlockRequirements: [
      { type: 'ascensionLevel', value: 10 },
      { type: 'systemMastery', value: 1, systemId: 'home' },
      { type: 'systemMastery', value: 1, systemId: 'binary' },
      { type: 'systemMastery', value: 1, systemId: 'nebula' },
      { type: 'systemMastery', value: 1, systemId: 'blackhole' },
    ],
    planetIds: ['dysonCore'],
    masteryProgress: 0,
    masteryComplete: false,
  },
};

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createInitialBinaryState(): BinarySystemState {
  return {
    phase: 'dawn',
    phaseStartTime: Date.now(),
    solarFlareActive: false,
    solarFlareStartTime: null,
    solarSiloCargo: 0,
  };
}

export function createInitialNebulaState(): NebulaSystemState {
  return {
    density: 0,
    crystalsAvailable: 0,
    lastCrystalSpawn: 0,
  };
}

export function createInitialBlackHoleState(): BlackHoleSystemState {
  return {
    planetStability: {
      accretionPrime: 100,
      temporalRefuge: 100,
      singularitysEdge: 100,
    },
    eventHorizonActive: false,
    collapsedPlanets: [],
  };
}

export function createInitialDysonState(): DysonSphereState {
  return {
    efficiency: 1, // Starts at 1%
    activeProjects: [],
    completedUpgrades: [],
  };
}

export function createInitialStarSystem(systemId: string): StarSystem {
  const definition = STAR_SYSTEM_DEFINITIONS[systemId];
  if (!definition) {
    throw new Error(`Unknown star system: ${systemId}`);
  }

  let uniqueState: StarSystem['uniqueState'] = null;

  switch (definition.type) {
    case 'binary':
      uniqueState = createInitialBinaryState();
      break;
    case 'nebula':
      uniqueState = createInitialNebulaState();
      break;
    case 'blackhole':
      uniqueState = createInitialBlackHoleState();
      break;
    case 'dyson':
      uniqueState = createInitialDysonState();
      break;
  }

  return {
    ...definition,
    uniqueState,
  };
}

export function createInitialTravelShip(): TravelShip {
  return {
    currentSystem: 'home',
    destinationSystem: null,
    travelStartTime: null,
    travelDuration: 0,
    cargo: [],
    maxCargo: SHIP_BASE_CARGO,
    upgradeLevel: 0,
  };
}

export function createInitialStarSystemsState(): StarSystemsState {
  const systems: Record<string, StarSystem> = {};

  for (const systemId of Object.keys(STAR_SYSTEM_DEFINITIONS)) {
    systems[systemId] = createInitialStarSystem(systemId);
  }

  return {
    galaxyMapUnlocked: false, // Unlocks at Ascension 1
    systems,
    ship: createInitialTravelShip(),
    tradeRoutes: [],
    maxTradeRoutes: 2,
    activeSynergies: [],
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get current binary phase based on time.
 * Handles cycle wrap - after 20 minutes, the cycle repeats.
 */
export function getBinaryPhase(state: BinarySystemState): BinaryPhase {
  const elapsed = Date.now() - state.phaseStartTime;
  // Normalize to current position in cycle (handles wrap after 20 minutes)
  const normalizedElapsed =
    ((elapsed % BINARY_FULL_CYCLE_MS) + BINARY_FULL_CYCLE_MS) % BINARY_FULL_CYCLE_MS;
  let accumulated = 0;

  const phases: BinaryPhase[] = ['dawn', 'day', 'dusk', 'night'];
  for (const phase of phases) {
    accumulated += BINARY_PHASE_DURATIONS[phase];
    if (normalizedElapsed < accumulated) {
      return phase;
    }
  }

  // Fallback (should not reach here due to normalization)
  return 'dawn';
}

/**
 * Get time until next phase in binary system.
 * Handles cycle wrap correctly.
 */
export function getTimeUntilNextPhase(state: BinarySystemState): number {
  const elapsed = Date.now() - state.phaseStartTime;
  // Normalize to current position in cycle
  const normalizedElapsed =
    ((elapsed % BINARY_FULL_CYCLE_MS) + BINARY_FULL_CYCLE_MS) % BINARY_FULL_CYCLE_MS;
  let accumulated = 0;

  const phases: BinaryPhase[] = ['dawn', 'day', 'dusk', 'night'];
  for (const phase of phases) {
    accumulated += BINARY_PHASE_DURATIONS[phase];
    if (normalizedElapsed < accumulated) {
      return accumulated - normalizedElapsed;
    }
  }

  // Fallback (should not reach here)
  return BINARY_FULL_CYCLE_MS - normalizedElapsed;
}

/**
 * Get production multiplier for binary system based on phase.
 * Dawn/dusk are transition phases with partial bonuses.
 * Per design doc: dawn ramps +50%→+100%, dusk ramps +100%→+50%.
 */
export function getBinaryProductionMultiplier(phase: BinaryPhase): number {
  switch (phase) {
    case 'dawn':
      return 1.75; // Ramping up: average of +50% to +100%
    case 'day':
      return 2.0; // Full sunlight: +100%
    case 'dusk':
      return 1.75; // Ramping down: average of +100% to +50%
    case 'night':
      return 0.5; // -50% production
  }
}

/**
 * Get export capacity multiplier for binary system
 */
export function getBinaryExportMultiplier(phase: BinaryPhase): number {
  // Night has double export capacity
  return phase === 'night' ? 4.0 : 2.0; // Binary always has 2x base
}

/**
 * Calculate travel time between systems
 */
export function calculateTravelTime(
  fromSystem: string,
  toSystem: string,
  upgradeLevel: number
): number {
  if (fromSystem === toSystem) return 0;

  const baseTime = BASE_TRAVEL_TIMES[fromSystem]?.[toSystem] || 60 * 60 * 1000;

  // Each upgrade level reduces travel time by 20%
  const multiplier = Math.pow(0.8, upgradeLevel);

  return Math.floor(baseTime * multiplier);
}

/**
 * Check if a star system is unlocked based on requirements
 */
export function checkSystemUnlockRequirements(
  systemId: string,
  ascensionLevel: number,
  totalPrestigePoints: number,
  legendaryManagerCount: number,
  systemMastery: Record<string, boolean>
): boolean {
  const definition = STAR_SYSTEM_DEFINITIONS[systemId];
  if (!definition) return false;

  for (const req of definition.unlockRequirements) {
    switch (req.type) {
      case 'ascensionLevel':
        if (ascensionLevel < req.value) return false;
        break;
      case 'prestigePoints':
        if (totalPrestigePoints < req.value) return false;
        break;
      case 'legendaryManagers':
        if (legendaryManagerCount < req.value) return false;
        break;
      case 'systemMastery':
        if (req.systemId && !systemMastery[req.systemId]) return false;
        break;
    }
  }

  return true;
}

/**
 * Calculate trade route income
 */
export function calculateTradeRouteIncome(
  route: TradeRoute,
  sourceHourlyOutput: number,
  managerBonus: number = 0
): number {
  if (!route.active) return 0;

  const baseEfficiency = TRADE_ROUTE_EFFICIENCY[route.level] || 0.1;
  const totalEfficiency = baseEfficiency + managerBonus;

  return Math.floor(sourceHourlyOutput * totalEfficiency);
}

/**
 * Get nebula density level name
 */
export function getNebulaDensityLevel(density: number): 'sparse' | 'dense' | 'thick' | 'critical' {
  if (density >= 75) return 'critical';
  if (density >= 50) return 'thick';
  if (density >= 25) return 'dense';
  return 'sparse';
}

/**
 * Get refinement multiplier for nebula based on density
 */
export function getNebulaRefinementMultiplier(density: number): number {
  const level = getNebulaDensityLevel(density);
  switch (level) {
    case 'critical':
      return 3.0 * 1.5; // 3x base + 50% bonus
    case 'thick':
      return 3.0 * 1.25; // 3x base + 25% bonus
    case 'dense':
      return 3.0 * 1.1; // 3x base + 10% bonus
    default:
      return 3.0; // 3x base
  }
}

/**
 * Get production modifier for nebula based on density
 */
export function getNebulaProductionModifier(density: number): number {
  const level = getNebulaDensityLevel(density);
  switch (level) {
    case 'critical':
      return 0.5; // -50%
    case 'thick':
      return 0.75; // -25%
    case 'dense':
      return 0.9; // -10%
    default:
      return 1.0;
  }
}

/**
 * Check if black hole Event Horizon should activate
 */
export function checkEventHorizon(stability: Record<string, number>): boolean {
  const values = Object.values(stability);
  return values.length > 0 && values.every(s => s < 50);
}

/**
 * Get black hole stability status
 */
export function getStabilityStatus(
  stability: number
): 'stable' | 'unstable' | 'critical' | 'collapse' {
  if (stability >= 75) return 'stable';
  if (stability >= 50) return 'unstable';
  if (stability >= 25) return 'critical';
  return 'collapse';
}

/**
 * Calculate black hole production multiplier
 */
export function getBlackHoleProductionMultiplier(
  stability: number,
  eventHorizonActive: boolean
): number {
  let base = 10.0; // 10x base production

  // Event Horizon doubles it
  if (eventHorizonActive) {
    base *= 2;
  }

  // Instability reduces production
  if (stability < 75) {
    base *= 0.9; // -10% when unstable
  }

  return base;
}
