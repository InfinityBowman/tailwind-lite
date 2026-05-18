/**
 * Highlight Component
 * Highlights text matches in search results
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface HighlightProps {
  text: string;
  query: string;
  highlightClassName?: string;
  className?: string;
}

const Highlight: React.FC<HighlightProps> = ({
  text,
  query,
  highlightClassName = 'bg-yellow-500/30 text-yellow-200',
  className,
}) => {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className={cn('rounded-sm', highlightClassName)}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export default Highlight;
