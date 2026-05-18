/**
 * Aspect Ratio Container
 * Maintains aspect ratio for content
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface AspectRatioProps {
  ratio?: number; // width / height (e.g., 16/9)
  className?: string;
  children: React.ReactNode;
}

const AspectRatio: React.FC<AspectRatioProps> = ({ ratio = 16 / 9, className, children }) => {
  return (
    <div
      className={cn('relative w-full', className)}
      style={{ paddingBottom: `${(1 / ratio) * 100}%` }}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
};

export default AspectRatio;
