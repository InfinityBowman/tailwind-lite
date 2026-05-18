/**
 * Anomaly Container
 * Connects to game engine and renders AnomalyBanner and LuckyStarIndicator
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useGame } from '../../contexts/GameEngineContext';
import { isNavSectionUnlocked } from '../../game/config/unlocks';
import AnomalyBanner from './AnomalyBanner';
import LuckyStarIndicator from './LuckyStarIndicator';

export const AnomalyContainer: React.FC = () => {
  const { state, getAnomalyState, collectAnomaly, getActiveEvent } = useGame();
  const anomalyState = getAnomalyState();

  // Check if event banner is showing (affects positioning)
  const eventsUnlocked = isNavSectionUnlocked('events', state);
  const hasActiveEvent = eventsUnlocked && !!getActiveEvent();

  const handleCollect = () => {
    collectAnomaly();
  };

  // Don't render if anomaly state isn't loaded yet
  if (!anomalyState) return null;

  return (
    <>
      {/* Active Anomaly Banner */}
      {anomalyState.activeAnomaly && (
        <AnomalyBanner
          anomaly={anomalyState.activeAnomaly}
          onCollect={handleCollect}
          hasActiveEvent={hasActiveEvent}
        />
      )}

      {/* Lucky Star Buff Indicator - positioned below header, accounting for EventBanner */}
      {anomalyState.luckyStarBuff && (
        <div
          className={cn(
            'fixed left-1/2 -translate-x-1/2 z-40',
            // Below EventBanner (h-10) + Header (h-14) + gap, or just below Header
            // top-16 = 64px (header ends at 56px), top-28 = 112px (event+header ends at 96px)
            hasActiveEvent ? 'top-28' : 'top-16'
          )}
        >
          <LuckyStarIndicator buff={anomalyState.luckyStarBuff} />
        </div>
      )}
    </>
  );
};

export default AnomalyContainer;
