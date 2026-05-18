/**
 * Media Query Component
 * Render children based on media query
 */

import React from 'react';

interface MediaQueryProps {
  query: string; // CSS media query
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

const MediaQuery: React.FC<MediaQueryProps> = ({ query, children, fallback = null }) => {
  const matches = useMediaQuery(query);
  return <>{matches ? children : fallback}</>;
};

// Presets
const Mobile: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MediaQuery query="(max-width: 639px)">{children}</MediaQuery>
);

const Desktop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MediaQuery query="(min-width: 640px)">{children}</MediaQuery>
);

export { MediaQuery, Mobile, Desktop, useMediaQuery };
