/**
 * Hotkey Hint
 * Shows keyboard shortcut hints inline
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface HotkeyHintProps {
  keys: string[]; // e.g., ['Ctrl', 'S']
  className?: string;
}

const HotkeyHint: React.FC<HotkeyHintProps> = ({ keys, className }) => {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-700 border border-slate-600 rounded text-slate-300">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-slate-500">+</span>}
        </React.Fragment>
      ))}
    </span>
  );
};

export default HotkeyHint;
