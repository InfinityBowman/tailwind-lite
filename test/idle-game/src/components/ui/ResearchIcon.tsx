/**
 * ResearchIcon Component
 * Displays a research icon by name
 */

import React from 'react';
import { getIcon, type IconName } from '../../utils/assets';

interface ResearchIconProps {
  icon: IconName;
  size?: number;
  className?: string;
}

const ResearchIcon: React.FC<ResearchIconProps> = ({ icon, size = 32, className = '' }) => {
  const iconSrc = getIcon(icon);

  if (!iconSrc) {
    // Fallback to colored placeholder
    return (
      <div
        className={`inline-flex items-center justify-center rounded bg-gradient-to-br from-purple-500/30 to-blue-500/30 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-purple-300" style={{ fontSize: size * 0.5 }}>
          ?
        </span>
      </div>
    );
  }

  return (
    <img
      src={iconSrc}
      alt={icon}
      style={{ width: size, height: size }}
      className={`inline-block ${className}`}
      loading="lazy"
    />
  );
};

export default ResearchIcon;
