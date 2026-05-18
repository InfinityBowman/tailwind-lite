/**
 * Accordion Component
 * Collapsible content sections
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className,
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));
  const prefersReducedMotion = useReducedMotion();

  const toggle = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div
      className={cn(
        'divide-y divide-slate-700 rounded-lg border border-slate-700 overflow-hidden',
        className
      )}
    >
      {items.map(item => {
        const isOpen = openItems.has(item.id);

        return (
          <div key={item.id}>
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-white">{item.title}</span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-slate-400 shrink-0',
                  !prefersReducedMotion && 'transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>

            {isOpen && <div className="px-4 pb-4 text-sm text-slate-300">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
export type { AccordionItem };
