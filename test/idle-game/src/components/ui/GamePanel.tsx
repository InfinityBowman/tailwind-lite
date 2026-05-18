/**
 * GamePanel - Shared panel styling for the gameplay UI
 *
 * Provides consistent retro-terminal aesthetic across all game components.
 * Matches the AILandingPage design language.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface GamePanelProps {
  children: React.ReactNode;
  className?: string;
  /** Adds the subtle grid background */
  withGrid?: boolean;
  /** Adds scan line overlay effect */
  withScanlines?: boolean;
  /** Glow color for the panel border */
  glowColor?: string;
  /** Panel header content */
  header?: React.ReactNode;
}

export const GamePanel: React.FC<GamePanelProps> = ({
  children,
  className,
  withGrid = false,
  withScanlines = false,
  glowColor,
  header,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        'bg-slate-900/80 backdrop-blur-sm',
        'border border-slate-700/50',
        className
      )}
      style={
        glowColor
          ? {
              boxShadow: `0 0 20px ${glowColor}15, inset 0 1px 0 ${glowColor}10`,
            }
          : undefined
      }
    >
      {/* Grid background */}
      {withGrid && (
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(34 211 238) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(34 211 238) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      )}

      {/* Scanlines overlay */}
      {withScanlines && (
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />
      )}

      {/* Header */}
      {header && (
        <div className="relative border-b border-slate-700/50 px-4 py-3 bg-slate-800/30">
          {header}
        </div>
      )}

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
};

/** Section header with terminal-style decoration */
export const PanelHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ icon, title, subtitle, status, actions }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400 border border-cyan-500/20">
          {icon}
        </div>
      )}
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-100">{title}</h3>
          {status}
        </div>
        {subtitle && <p className="text-xs text-slate-500 font-mono">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

/** Status badge with pulse animation */
export const StatusBadge: React.FC<{
  status: 'online' | 'warning' | 'error' | 'idle';
  label?: string;
}> = ({ status, label }) => {
  const colors = {
    online: 'bg-emerald-500 shadow-emerald-500/50',
    warning: 'bg-amber-500 shadow-amber-500/50',
    error: 'bg-red-500 shadow-red-500/50',
    idle: 'bg-slate-500 shadow-slate-500/50',
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
      <span className={cn('w-2 h-2 rounded-full animate-pulse shadow-sm', colors[status])} />
      {label && <span className="uppercase tracking-wider">{label}</span>}
    </div>
  );
};

/** Data display with monospace styling */
export const DataValue: React.FC<{
  label?: string;
  value: string | number;
  unit?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ label, value, unit, color, size = 'md' }) => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <div className="flex flex-col">
      {label && (
        <span className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</span>
      )}
      <span
        className={cn('font-mono tabular-nums font-medium', sizes[size])}
        style={{ color: color || 'rgb(226 232 240)' }}
      >
        {value}
        {unit && <span className="text-slate-500 ml-0.5">{unit}</span>}
      </span>
    </div>
  );
};

/** Progress bar with glow effect */
export const GlowProgress: React.FC<{
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}> = ({ value, max, color = 'rgb(34 211 238)', showLabel = false, size = 'md' }) => {
  const percent = Math.min(100, (value / max) * 100);
  const heights = { sm: 'h-1.5', md: 'h-2.5' };

  return (
    <div className="w-full">
      <div className={cn('w-full bg-slate-800 rounded-full overflow-hidden', heights[size])}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}50`,
          }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-[10px] font-mono text-slate-500">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default GamePanel;
