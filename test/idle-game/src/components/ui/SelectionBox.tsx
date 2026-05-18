/**
 * Selection Box
 * Selectable option card
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SelectionBoxProps {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  showCheck?: boolean;
  className?: string;
}

const SelectionBox: React.FC<SelectionBoxProps> = ({
  selected,
  onSelect,
  children,
  disabled = false,
  showCheck = true,
  className,
}) => {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'relative p-4 rounded-lg border-2 text-left transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        selected
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-slate-700 hover:border-slate-600 bg-slate-800/50',
        className
      )}
    >
      {showCheck && selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      {children}
    </button>
  );
};

export default SelectionBox;
