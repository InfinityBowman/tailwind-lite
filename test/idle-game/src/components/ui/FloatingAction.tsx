/**
 * Floating Action Button
 * Fixed position action button
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from './button';
import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface FloatingActionProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon;
  label: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const positions = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
};

const FloatingAction: React.FC<FloatingActionProps> = ({
  icon: Icon,
  label,
  position = 'bottom-right',
  className,
  ...props
}) => {
  return (
    <div className={cn('fixed z-50', positions[position])}>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              className={cn('w-14 h-14 rounded-full p-0 shadow-lg', className)}
              aria-label={label}
              {...props}
            >
              <Icon className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default FloatingAction;
