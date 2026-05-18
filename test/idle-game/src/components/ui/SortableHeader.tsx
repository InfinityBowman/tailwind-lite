/**
 * Sortable Header
 * Table column header with sort indicator
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort?: { key: string; direction: SortDirection };
  onSort?: (key: string, direction: SortDirection) => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  children,
  sortKey,
  currentSort,
  onSort,
  className,
}) => {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  const handleClick = () => {
    if (!onSort) return;

    let nextDirection: SortDirection;
    if (!isActive || direction === null) {
      nextDirection = 'asc';
    } else if (direction === 'asc') {
      nextDirection = 'desc';
    } else {
      nextDirection = null;
    }

    onSort(sortKey, nextDirection);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-1 text-left font-medium transition-colors',
        'hover:text-white',
        isActive ? 'text-white' : 'text-slate-400',
        className
      )}
    >
      {children}
      {direction === 'asc' && <ArrowUp className="w-4 h-4" />}
      {direction === 'desc' && <ArrowDown className="w-4 h-4" />}
      {!direction && <ArrowUpDown className="w-4 h-4 opacity-50" />}
    </button>
  );
};

export default SortableHeader;
export type { SortDirection };
