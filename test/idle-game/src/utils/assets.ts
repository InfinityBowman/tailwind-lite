/**
 * Asset Utility Functions
 * Manages loading and paths for generated assets (planets, seeds, icons)
 */

// === Tier Mapping ===
const TIER_NAMES: Record<number, string> = {
  0: 'fodder',
  1: 'common',
  2: 'uncommon',
  3: 'rare',
  4: 'epic',
  5: 'legendary',
  6: 'mythic',
};

export const getTierName = (tier: number): string => {
  return TIER_NAMES[tier] || 'common';
};

// === Planet Images ===
// Map planet IDs to their corresponding image filenames
const PLANET_IMAGE_MAP: Record<string, string> = {
  greenPlanet: 'green_planet',
  redPlanet: 'red_planet',
  bluePlanet: 'blue_planet',
  purplePlanet: 'purple_planet',
  orangePlanet: 'orange_planet',
  goldPlanet: 'gold_planet',
  icePlanet: 'ice_planet',
  desertPlanet: 'desert_planet',
  voidPlanet: 'void_planet',
};

// Dynamically import all planet images
const planetImages = import.meta.glob<{ default: string }>('../assets/generated/planets/*.png', {
  eager: true,
});

export const getPlanetImage = (planetId: string): string | null => {
  const filename = PLANET_IMAGE_MAP[planetId];
  if (!filename) return null;

  const key = `../assets/generated/planets/${filename}.png`;
  const module = planetImages[key];
  return module?.default || null;
};

// === Seed Images ===
// Available seed types with images
const SEED_TYPES_WITH_IMAGES = [
  'wheat',
  'corn',
  'potato',
  'carrot',
  'tomato',
  'cucumber',
  'rice',
  'soybean',
  'pumpkin',
  'starfruit',
];

// Dynamically import all seed images
const seedImages = import.meta.glob<{ default: string }>('../assets/generated/seeds/*.png', {
  eager: true,
});

export const getSeedImage = (seedType: string, tier: number): string | null => {
  // Check if this seed type has generated images
  if (!SEED_TYPES_WITH_IMAGES.includes(seedType)) {
    return null;
  }

  const tierName = getTierName(tier);
  const key = `../assets/generated/seeds/${seedType}_${tierName}.png`;
  const module = seedImages[key];
  return module?.default || null;
};

// === Crop Images (harvested plants for Resources panel) ===
const cropImages = import.meta.glob<{ default: string }>('../assets/generated/crops/*.png', {
  eager: true,
});

export const getCropImage = (cropType: string): string | null => {
  const key = `../assets/generated/crops/${cropType}.png`;
  const module = cropImages[key];
  return module?.default || null;
};

// === Icon Images ===
const iconImages = import.meta.glob<{ default: string }>('../assets/generated/icons/*.png', {
  eager: true,
});

export type IconName =
  | 'credits'
  | 'essence'
  | 'premium'
  | 'upgrade'
  // Research icons
  | 'chart'
  | 'growth'
  | 'lightning'
  | 'robot'
  | 'cargo'
  | 'leaf'
  | 'sleep'
  | 'rocket'
  | 'crown'
  | 'star'
  | 'sparkle'
  | 'flask'
  | 'prestige'
  | 'ship';

export const getIcon = (name: IconName): string | null => {
  const key = `../assets/generated/icons/${name}.png`;
  const module = iconImages[key];
  return module?.default || null;
};

// === Tier Color Styles ===
// Returns CSS class or style for tier glow effects
export const TIER_COLORS: Record<number, { color: string; glow: string }> = {
  0: { color: '#9CA3AF', glow: 'none' }, // fodder - gray
  1: { color: '#FFFFFF', glow: 'none' }, // common - white
  2: { color: '#22C55E', glow: '0 0 8px #22C55E' }, // uncommon - green
  3: { color: '#3B82F6', glow: '0 0 10px #3B82F6' }, // rare - blue
  4: { color: '#A855F7', glow: '0 0 12px #A855F7' }, // epic - purple
  5: { color: '#F97316', glow: '0 0 14px #F97316' }, // legendary - orange
  6: { color: '#EC4899', glow: '0 0 16px #EC4899' }, // mythic - pink
};

export const getTierStyles = (tier: number) => {
  const tierStyle = TIER_COLORS[tier] || TIER_COLORS[1];
  return {
    color: tierStyle.color,
    borderColor: tierStyle.color,
    boxShadow: tierStyle.glow,
  };
};
