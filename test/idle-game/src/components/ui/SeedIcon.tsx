/**
 * SeedIcon Component
 * Displays a seed image with tier-appropriate styling (glow, border)
 */

import React from 'react';
import { getSeedImage, getTierStyles, getTierName } from '../../utils/assets';
import { SEED_TYPES, SEED_FAMILY_INFO } from '../../game';
import type { SeedInstance } from '../../game';

interface SeedIconProps {
  seed: SeedInstance | { id: string; tier: number; name?: string };
  size?: number;
  showTierBadge?: boolean;
  showFamily?: boolean;
  className?: string;
}

const SeedIcon: React.FC<SeedIconProps> = ({
  seed,
  size = 32,
  showTierBadge = false,
  showFamily = false,
  className = '',
}) => {
  const imageSrc = getSeedImage(seed.id, seed.tier);
  const tierStyles = getTierStyles(seed.tier);
  const tierName = getTierName(seed.tier);

  // Get seed family info
  const seedType = SEED_TYPES[seed.id];
  const family = seedType?.family;
  const familyInfo = family ? SEED_FAMILY_INFO[family] : null;

  // Fallback: show colored placeholder with first letter
  const getFallbackColor = (seedId: string): string => {
    const colorMap: Record<string, string> = {
      wheat: '#F5DEB3',
      corn: '#FFE135',
      potato: '#DEB887',
      carrot: '#FF7F00',
      tomato: '#FF6347',
      cucumber: '#228B22',
      rice: '#FFFFF0',
      soybean: '#8B7355',
      pumpkin: '#FF7518',
      starfruit: '#FFD700',
    };
    return colorMap[seedId] || '#66BB6A';
  };

  if (!imageSrc) {
    // Fallback to colored placeholder with gradient
    const baseColor = getFallbackColor(seed.id);
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-lg ${className}`}
        style={{
          width: size,
          height: size,
          border: `2px solid ${tierStyles.borderColor}`,
          boxShadow: tierStyles.boxShadow,
          background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}88 100%)`,
        }}
      >
        <span className="font-bold text-black/60" style={{ fontSize: size * 0.45 }}>
          {seed.id.charAt(0).toUpperCase()}
        </span>
        {showTierBadge && (
          <span
            className="absolute -bottom-1 -right-1 text-xs font-bold px-1 rounded"
            style={{
              backgroundColor: tierStyles.borderColor,
              color: '#000',
              fontSize: size * 0.3,
            }}
          >
            T{seed.tier}
          </span>
        )}
        {showFamily && familyInfo && (
          <span
            className="absolute -top-1 -left-1 w-3 h-3 rounded-full border border-black/30"
            style={{ backgroundColor: familyInfo.color }}
            title={familyInfo.name}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-block rounded-lg overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        border: `2px solid ${tierStyles.borderColor}`,
        boxShadow: tierStyles.boxShadow,
      }}
    >
      <img
        src={imageSrc}
        alt={`${seed.name || seed.id} (${tierName})`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {showTierBadge && (
        <span
          className="absolute bottom-0 right-0 text-xs font-bold px-1 rounded-tl-xl"
          style={{
            backgroundColor: tierStyles.borderColor,
            color: '#000',
            fontSize: size * 0.25,
          }}
        >
          T{seed.tier}
        </span>
      )}
      {showFamily && familyInfo && (
        <span
          className="absolute -top-1 -left-1 w-3 h-3 rounded-full border border-black/30"
          style={{ backgroundColor: familyInfo.color }}
          title={familyInfo.name}
        />
      )}
    </div>
  );
};

export default SeedIcon;
