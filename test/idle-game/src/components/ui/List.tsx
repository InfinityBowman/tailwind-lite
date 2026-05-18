/**
 * List Components
 * Styled list with items
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ListProps {
  children: React.ReactNode;
  divided?: boolean;
  className?: string;
}

const List: React.FC<ListProps> = ({ children, divided = true, className }) => {
  return (
    <ul
      className={cn(
        'rounded-lg overflow-hidden',
        divided && 'divide-y divide-slate-700/50',
        className
      )}
    >
      {children}
    </ul>
  );
};

interface ListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  leadingContent?: React.ReactNode;
  trailingContent?: React.ReactNode;
  showChevron?: boolean;
  className?: string;
}

const ListItem: React.FC<ListItemProps> = ({
  children,
  onClick,
  leadingContent,
  trailingContent,
  showChevron = false,
  className,
}) => {
  const Component = onClick ? 'button' : 'li';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 w-full text-left',
        onClick && 'hover:bg-slate-800/50 transition-colors cursor-pointer',
        className
      )}
    >
      {leadingContent && <div className="shrink-0">{leadingContent}</div>}

      <div className="flex-1 min-w-0">{children}</div>

      {trailingContent && <div className="shrink-0">{trailingContent}</div>}

      {showChevron && onClick && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
    </Component>
  );
};

export { List, ListItem };
