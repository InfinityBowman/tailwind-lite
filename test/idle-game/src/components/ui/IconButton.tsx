/**
 * Icon Button
 * Button containing only an icon with tooltip
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from './button';
import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon;
  label: string; // Required for accessibility
  showTooltip?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  showTooltip = true,
  className,
  size = 'sm',
  variant = 'ghost',
  ...props
}) => {
  const button = (
    <Button
      variant={variant}
      size={size}
      className={cn('p-2', className)}
      aria-label={label}
      {...props}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );

  if (showTooltip) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

export default IconButton;
