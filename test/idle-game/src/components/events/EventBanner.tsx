/**
 * Event Banner
 * Compact banner showing active events (for header/sidebar)
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Calendar, ChevronRight } from 'lucide-react';
import type { GameEvent } from '../../game/systems/EventSystem';
import { getEventTimeRemaining } from '../../game/systems/EventSystem';
import { useGame } from '../../contexts/GameEngineContext';
import { isNavSectionUnlocked } from '../../game/config/unlocks';

interface EventBannerProps {
  events?: GameEvent[];
  onClick?: () => void;
  className?: string;
}

const EventBanner: React.FC<EventBannerProps> = ({ events: propEvents, onClick, className }) => {
  // Get events from context if not passed as prop
  const { state } = useGame();
  const events = propEvents ?? state.events?.activeEvents ?? [];

  // Don't show banner if events aren't unlocked yet (500 lifetime credits)
  const eventsUnlocked = isNavSectionUnlocked('events', state);
  if (!eventsUnlocked || events.length === 0) return null;

  const primaryEvent = events[0];
  const timeRemaining = getEventTimeRemaining(primaryEvent);
  const isUrgent = timeRemaining < 3600000;

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <button
      onClick={onClick}
      aria-label={
        events.length === 1
          ? `View ${primaryEvent.name} event details`
          : `View ${events.length} active events`
      }
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-10 flex items-center justify-between px-4 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset backdrop-blur-md',
        isUrgent
          ? 'bg-red-500/20 hover:bg-red-500/30 border-b border-red-500/40 focus-visible:ring-red-500'
          : 'bg-purple-500/20 hover:bg-purple-500/30 border-b border-purple-500/40 focus-visible:ring-purple-500',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Calendar
          className={cn('w-4 h-4 shrink-0', isUrgent ? 'text-red-400' : 'text-purple-400')}
        />
        <span className="text-sm font-medium text-white truncate">
          {events.length === 1 ? primaryEvent.name : `${events.length} Active Events`}
        </span>
        <span className={cn('text-xs shrink-0', isUrgent ? 'text-red-400' : 'text-slate-400')}>
          · {isUrgent ? 'Ending soon!' : formatTime(timeRemaining)}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
    </button>
  );
};

export default EventBanner;
