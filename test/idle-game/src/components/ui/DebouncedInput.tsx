/**
 * Debounced Input
 * Text input that delays onChange until typing stops
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  showClear?: boolean;
  showIcon?: boolean;
  className?: string;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value: externalValue,
  onChange,
  debounceMs = 300,
  placeholder = 'Search...',
  showClear = true,
  showIcon = true,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(externalValue);

  // Sync external value changes
  useEffect(() => {
    setInternalValue(externalValue);
  }, [externalValue]);

  // Debounce the onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== externalValue) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange, externalValue]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      {showIcon && (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      )}

      <input
        type="text"
        value={internalValue}
        onChange={e => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-slate-800 border border-white/10 rounded-lg',
          'text-white placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50',
          showIcon ? 'pl-10 pr-10 py-2' : 'px-4 py-2'
        )}
      />

      {showClear && internalValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default DebouncedInput;
