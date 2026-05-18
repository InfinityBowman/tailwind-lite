import React from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { getContextualHint } from '../../game/services/HintService';
import { isNavSectionUnlocked } from '../../game/config/unlocks';
import { Button } from './button';
import { X, Lightbulb, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ContextualHintBarProps {
  onNavigate?: (tabId: string) => void;
}

/**
 * A non-intrusive hint bar that shows contextual guidance based on player state.
 * Fixed position below the header, accounting for EventBanner when active.
 */
export const ContextualHintBar: React.FC<ContextualHintBarProps> = ({ onNavigate }) => {
  const { state, dismissHint, getActiveEvent } = useGame();

  const hint = getContextualHint(state);

  // Check if event banner is showing (affects positioning)
  const eventsUnlocked = isNavSectionUnlocked('events', state);
  const hasActiveEvent = eventsUnlocked && !!getActiveEvent();

  // Don't render if no hint (getContextualHint already filters dismissed hints)
  if (!hint) {
    return null;
  }

  const handleDismiss = () => {
    dismissHint(hint.id);
  };

  const handleAction = () => {
    if (hint.targetTab && onNavigate) {
      onNavigate(hint.targetTab);
    }
    // Auto-dismiss after action click for better UX
    dismissHint(hint.id);
  };

  return (
    <div
      className={cn(
        'fixed right-0 z-20 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-b border-amber-500/30',
        // Position below header (h-14 = 56px = top-14)
        // If event banner is showing, header is at top-10, so hint bar is at top-24 (10+14)
        hasActiveEvent ? 'top-24' : 'top-14',
        // Mobile: full width. Desktop: offset by sidebar width (14rem = 224px = left-56)
        'left-0 lg:left-56'
      )}
    >
      <div className="px-4 py-2 flex items-center gap-3">
        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-amber-200">{hint.title}</span>
          <span className="text-sm text-amber-100/80 ml-2">{hint.message}</span>
        </div>
        {hint.action && hint.targetTab && onNavigate && (
          <Button
            onClick={handleAction}
            variant="ghost"
            size="sm"
            className="text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 shrink-0"
          >
            {hint.action}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-amber-400/60 hover:text-amber-200 hover:bg-amber-500/20 shrink-0"
          aria-label="Dismiss hint"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ContextualHintBar;
