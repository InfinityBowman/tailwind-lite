/**
 * Suggested Action Button
 *
 * A floating action button that shows the most important next action.
 * More prominent than the hint bar - designed to guide new players.
 *
 * Features:
 * - Shows highest priority hint as an actionable button
 * - Pulses to attract attention
 * - Expands on hover (desktop) or tap (mobile)
 * - Can be temporarily dismissed (reappears after time or on new hint)
 * - Full keyboard and screen reader accessibility
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { getContextualHint } from '../../game/services/HintService';
import { cn } from '@/lib/utils';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import { Button } from './button';

interface SuggestedActionButtonProps {
  onNavigate?: (tabId: string) => void;
  className?: string;
}

const DISMISS_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Detect if device supports hover (desktop vs mobile)
 * Uses CSS media query matching for reliable detection
 */
function useHoverCapability(): boolean {
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover)');
    setCanHover(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return canHover;
}

/**
 * Floating button showing the next recommended action
 */
export const SuggestedActionButton: React.FC<SuggestedActionButtonProps> = ({
  onNavigate,
  className,
}) => {
  const { state, dismissHint } = useGame();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);
  const [lastHintId, setLastHintId] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const isClickInsideRef = useRef(false);
  const canHover = useHoverCapability();

  const hint = getContextualHint(state);

  // Reset dismissed state when hint changes to a new one
  const hintId = hint?.id ?? null;
  useEffect(() => {
    if (hintId && hintId !== lastHintId) {
      setLastHintId(hintId);
      if (dismissedUntil !== null) {
        setDismissedUntil(null);
      }
    }
  }, [hintId, lastHintId, dismissedUntil]);

  // Check if currently dismissed
  const isDismissed = dismissedUntil !== null && Date.now() < dismissedUntil;

  // Navigate and permanently dismiss this hint
  const handleNavigate = useCallback(() => {
    if (!hint) return;
    if (onNavigate && hint.targetTab) {
      onNavigate(hint.targetTab);
    }
    dismissHint(hint.id);
  }, [hint, onNavigate, dismissHint]);

  // Handle click - behavior differs by device capability
  const handleClick = useCallback(() => {
    // On touch devices, first tap expands, second tap navigates
    if (!canHover && !isExpanded) {
      setIsExpanded(true);
      return;
    }
    handleNavigate();
  }, [canHover, isExpanded, handleNavigate]);

  // Temporarily dismiss (will reappear after timeout or on new hint)
  const handleDismiss = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDismissedUntil(Date.now() + DISMISS_DURATION_MS);
    setIsExpanded(false);
  }, []);

  // Keyboard support for main button
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      } else if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    },
    [handleClick, isExpanded]
  );

  // Track mouse down inside to prevent race condition with click-outside
  const handleMouseDown = useCallback(() => {
    isClickInsideRef.current = true;
  }, []);

  // Close expanded state when clicking outside (mobile)
  // Use mousedown instead of click to avoid race conditions
  useEffect(() => {
    if (!isExpanded || canHover) return;

    const handleClickOutside = (e: MouseEvent) => {
      // Skip if the mousedown originated inside
      if (isClickInsideRef.current) {
        isClickInsideRef.current = false;
        return;
      }

      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    // Use a microtask delay to ensure the current click event completes
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, canHover]);

  // Handle hover for desktop
  const handleMouseEnter = useCallback(() => {
    if (canHover) {
      setIsExpanded(true);
    }
  }, [canHover]);

  const handleMouseLeave = useCallback(() => {
    if (canHover) {
      setIsExpanded(false);
    }
  }, [canHover]);

  // Don't show if no hint, no action, or dismissed
  if (!hint || !hint.action || !hint.targetTab || isDismissed) {
    return null;
  }

  return (
    <div
      ref={buttonRef}
      className={cn(
        // Fixed width in both states - use transform for smooth animation
        'fixed bottom-24 right-4 z-40',
        // GPU acceleration hint
        'will-change-transform',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Suggested action: ${hint.title}. ${hint.message}. Press Enter to ${hint.action}.`}
        className={cn(
          'relative bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg',
          'border border-purple-400/30 overflow-hidden',
          'cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-background',
          // Smooth transitions for all animatable properties
          'transition-[width,box-shadow] duration-300 ease-out',
          // Width-based animation (fixed values, not auto)
          isExpanded ? 'w-72' : 'w-16',
          // Only pulse when collapsed
          !isExpanded && 'animate-pulse-subtle'
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Main content row */}
        <div
          className={cn(
            'flex items-center gap-3 p-3',
            'transition-[padding] duration-300 ease-out',
            isExpanded && 'pb-1'
          )}
        >
          {/* Icon - always visible */}
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
          </div>

          {/* Expanded content - opacity animation only, no width changes */}
          <div
            className={cn(
              'flex-1 min-w-0 overflow-hidden',
              'transition-opacity duration-300 ease-out',
              isExpanded ? 'opacity-100' : 'opacity-0'
            )}
            aria-hidden={!isExpanded}
          >
            <div className="text-white/90 text-xs font-medium uppercase tracking-wide">
              Suggested
            </div>
            <div className="text-white font-semibold text-sm truncate">{hint.title}</div>
          </div>

          {/* Dismiss button - always rendered, visibility animated */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'absolute top-1 right-1 h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10',
              'transition-opacity duration-200 ease-out',
              isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={handleDismiss}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleDismiss(e);
              }
            }}
            aria-label="Dismiss suggestion for 5 minutes"
            tabIndex={isExpanded ? 0 : -1}
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </Button>
        </div>

        {/* Expanded message and action - height animation */}
        <div
          className={cn(
            'overflow-hidden',
            'transition-[max-height,opacity] duration-300 ease-out',
            isExpanded ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
          )}
          aria-hidden={!isExpanded}
        >
          <div className="px-3 pb-3">
            <p className="text-white/80 text-xs mb-2 line-clamp-2">{hint.message}</p>
            <div className="flex items-center justify-end">
              <span className="text-white text-xs font-medium flex items-center gap-1">
                {hint.action}
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        {/* Glow effect */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

export default SuggestedActionButton;
