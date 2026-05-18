/**
 * PlanetImage Component
 * Displays a planet image with atmospheric glow effect
 */

import React from 'react';
import { getPlanetImage } from '../../utils/assets';

interface PlanetImageProps {
  planetId: string;
  color: string;
  size?: number;
  className?: string;
  glow?: boolean;
  pulse?: boolean;
  grayscale?: boolean;
}

const PlanetImage: React.FC<PlanetImageProps> = ({
  planetId,
  color,
  size = 48,
  className = '',
  glow = true,
  pulse = false,
  grayscale = false,
}) => {
  const imageSrc = getPlanetImage(planetId);

  const glowStyle = glow
    ? {
        boxShadow: `
      0 0 ${size * 0.2}px ${color}60,
      0 0 ${size * 0.4}px ${color}40,
      0 0 ${size * 0.6}px ${color}20
    `,
      }
    : {};

  const animationClass = pulse ? 'animate-planet-pulse' : '';
  const filterClass = grayscale ? 'grayscale brightness-50' : '';

  if (imageSrc) {
    return (
      <div
        className={`relative rounded-full ${animationClass} ${className}`}
        style={{
          width: size,
          height: size,
          ...glowStyle,
        }}
      >
        <img
          src={imageSrc}
          alt={planetId}
          className={`rounded-full object-cover w-full h-full ${filterClass}`}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback to colored circle with gradient
  return (
    <div
      className={`rounded-full ${animationClass} ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}, ${color}80 70%, ${color}40)`,
        ...glowStyle,
      }}
    />
  );
};

export default PlanetImage;
