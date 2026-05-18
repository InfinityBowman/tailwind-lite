/**
 * Callout Component
 * Highlighted content box for important information
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';

type CalloutVariant = 'default' | 'info' | 'success' | 'warning' | 'error' | 'tip';

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<
  CalloutVariant,
  { bg: string; border: string; icon: LucideIcon; iconColor: string }
> = {
  default: {
    bg: 'bg-slate-800/50',
    border: 'border-slate-700',
    icon: Info,
    iconColor: 'text-slate-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: Info,
    iconColor: 'text-blue-400',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: CheckCircle,
    iconColor: 'text-green-400',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: XCircle,
    iconColor: 'text-red-400',
  },
  tip: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: Lightbulb,
    iconColor: 'text-purple-400',
  },
};

const Callout: React.FC<CalloutProps> = ({
  variant = 'default',
  title,
  icon,
  children,
  className,
}) => {
  const config = variants[variant];
  const IconComponent = icon || config.icon;

  return (
    <div className={cn('rounded-lg border p-4', config.bg, config.border, className)}>
      <div className="flex gap-3">
        <IconComponent className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconColor)} />
        <div>
          {title && <h4 className="font-medium text-white mb-1">{title}</h4>}
          <div className="text-sm text-slate-300">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Callout;
