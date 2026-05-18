/**
 * Info Card
 * Displays helpful information with an icon
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Info, AlertCircle, CheckCircle, XCircle, type LucideIcon } from 'lucide-react';

type InfoCardVariant = 'info' | 'success' | 'warning' | 'error';

interface InfoCardProps {
  variant?: InfoCardVariant;
  title?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

const variants = {
  info: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: Info,
    iconColor: 'text-blue-400',
  },
  success: {
    bg: 'bg-green-500/10 border-green-500/30',
    icon: CheckCircle,
    iconColor: 'text-green-400',
  },
  warning: {
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    icon: AlertCircle,
    iconColor: 'text-yellow-400',
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/30',
    icon: XCircle,
    iconColor: 'text-red-400',
  },
};

const InfoCard: React.FC<InfoCardProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  className,
}) => {
  const config = variants[variant];
  const IconComponent = icon || config.icon;

  return (
    <div className={cn('flex gap-3 p-4 rounded-lg border', config.bg, className)}>
      <IconComponent className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-medium text-white mb-1">{title}</h4>}
        <div className="text-sm text-slate-300">{children}</div>
      </div>
    </div>
  );
};

export default InfoCard;
