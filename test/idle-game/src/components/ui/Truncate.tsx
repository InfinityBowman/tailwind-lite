/**
 * Truncate Component
 * Truncates text with ellipsis and optional tooltip
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface TruncateProps {
  text: string;
  maxLength?: number;
  showTooltip?: boolean;
  className?: string;
}

const Truncate: React.FC<TruncateProps> = ({
  text,
  maxLength = 50,
  showTooltip = true,
  className,
}) => {
  const isTruncated = text.length > maxLength;
  const displayText = isTruncated ? `${text.slice(0, maxLength)}...` : text;

  if (!isTruncated || !showTooltip) {
    return <span className={className}>{displayText}</span>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('cursor-help', className)}>{displayText}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="break-words">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Truncate;
