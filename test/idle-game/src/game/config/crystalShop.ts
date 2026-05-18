/**
 * Crystal Shop Configuration
 * Premium currency purchases
 */

export interface CrystalShopItem {
  id: string;
  name: string;
  description: string;
  cost: number; // crystals
  type: 'gacha' | 'essence' | 'timeSkip';
  value: number; // amount given
}

export const CRYSTAL_SHOP_ITEMS: Record<string, CrystalShopItem> = {
  premiumPull: {
    id: 'premiumPull',
    name: 'Premium Pull',
    description: 'Guaranteed Uncommon or better seed (no fodder)',
    cost: 50,
    type: 'gacha',
    value: 1,
  },
  premiumMultiPull: {
    id: 'premiumMultiPull',
    name: 'Premium x10',
    description: '10 pulls, all Uncommon or better',
    cost: 450, // 10% discount
    type: 'gacha',
    value: 10,
  },
  essencePackSmall: {
    id: 'essencePackSmall',
    name: 'Essence Pack',
    description: 'Instantly receive 25 Seed Essence',
    cost: 20,
    type: 'essence',
    value: 25,
  },
  essencePackLarge: {
    id: 'essencePackLarge',
    name: 'Essence Crate',
    description: 'Instantly receive 100 Seed Essence',
    cost: 70, // ~12% discount
    type: 'essence',
    value: 100,
  },
  timeWarp1h: {
    id: 'timeWarp1h',
    name: 'Time Warp (1h)',
    description: 'Apply 1 hour of offline progress instantly',
    cost: 10,
    type: 'timeSkip',
    value: 3600, // seconds
  },
  timeWarp8h: {
    id: 'timeWarp8h',
    name: 'Time Warp (8h)',
    description: 'Apply 8 hours of offline progress instantly',
    cost: 70, // ~12% discount
    type: 'timeSkip',
    value: 28800,
  },
} as const;
