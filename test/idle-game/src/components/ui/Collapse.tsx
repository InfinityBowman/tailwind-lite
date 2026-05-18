/**
 * Collapse Component
 * Animated expand/collapse content
 */

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface CollapseProps {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}

const Collapse: React.FC<CollapseProps> = ({ open, children, className }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(open ? 'auto' : 0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!contentRef.current) return;

    if (open) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);

      // After animation, set to auto for dynamic content
      const timer = setTimeout(() => setHeight('auto'), 200);
      return () => clearTimeout(timer);
    } else {
      // Get current height first
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);

      // Force reflow, then animate to 0
      requestAnimationFrame(() => {
        setHeight(0);
      });
    }
  }, [open]);

  return (
    <div
      ref={contentRef}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'hidden',
      }}
      className={cn(
        !prefersReducedMotion && 'transition-[height] duration-200 ease-in-out',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Collapse;
