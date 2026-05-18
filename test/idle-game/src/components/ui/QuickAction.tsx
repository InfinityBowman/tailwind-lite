/**
 * Quick Action Button
 * Shows a button with an optional keyboard shortcut hint
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from './button';
import HotkeyHint from './HotkeyHint';
import type { LucideIcon } from 'lucide-react';

interface QuickActionProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon;
  label: string;
  hotkey?: string[]; // e.g., ['Ctrl', 'S']
  showLabel?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon: Icon,
  label,
  hotkey,
  showLabel = true,
  className,
  ...props
}) => {
  return (
    <Button className={cn('relative gap-2', className)} {...props}>
      <Icon className="w-4 h-4" />
      {showLabel && <span>{label}</span>}

      {hotkey && <HotkeyHint keys={hotkey} className="ml-auto opacity-60" />}
    </Button>
  );
};

export default QuickAction;
