/**
 * Key-Value List Component
 * Displays a list of key-value pairs
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface KeyValueItem {
  key: string;
  value: React.ReactNode;
  highlight?: boolean;
}

interface KeyValueListProps {
  items: KeyValueItem[];
  separator?: boolean;
  className?: string;
}

const KeyValueList: React.FC<KeyValueListProps> = ({ items, separator = true, className }) => {
  return (
    <dl className={cn('space-y-2', className)}>
      {items.map((item, i) => (
        <div
          key={item.key}
          className={cn(
            'flex justify-between items-center',
            separator && i > 0 && 'border-t border-slate-700/50 pt-2'
          )}
        >
          <dt className="text-sm text-slate-400">{item.key}</dt>
          <dd
            className={cn('text-sm font-medium', item.highlight ? 'text-purple-400' : 'text-white')}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default KeyValueList;
export type { KeyValueItem };
