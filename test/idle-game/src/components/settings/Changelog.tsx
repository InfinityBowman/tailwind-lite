/**
 * Changelog Component
 * Displays game updates and patch notes
 */

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wrench, Bug, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'improvement' | 'fix' | 'balance';
    text: string;
  }[];
}

// Changelog data - workers update this when shipping features
const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.3.7',
    date: '2026-02-02',
    changes: [
      {
        type: 'balance',
        text: 'Capacity bottleneck indicator shows when production exceeds export',
      },
      {
        type: 'improvement',
        text: 'Yellow warning with tooltip explains when to upgrade capacity',
      },
    ],
  },
  {
    version: '0.3.6',
    date: '2026-02-02',
    changes: [
      { type: 'feature', text: 'Planet detail modal with tabbed content (Upgrades/Seeds/Stats)' },
      {
        type: 'improvement',
        text: 'Tapping a planet now opens a full detail view instead of inline expand',
      },
      {
        type: 'improvement',
        text: 'All planet management in one place: upgrades, seeds, stats, manager, mods',
      },
      {
        type: 'fix',
        text: 'Credit burst and toast popups now have better visibility with blurred backgrounds',
      },
    ],
  },
  {
    version: '0.3.5',
    date: '2026-02-02',
    changes: [{ type: 'feature', text: 'Keyboard shortcuts for quick navigation (P/G/R/Q/E/A)' }],
  },
  {
    version: '0.3.4',
    date: '2026-02-02',
    changes: [
      { type: 'feature', text: 'Next Steps suggestions panel for new players' },
      { type: 'fix', text: 'DevTools no longer flickers from frequent re-renders' },
      { type: 'improvement', text: 'Throttled DevTools display updates for smoother UX' },
    ],
  },
  {
    version: '0.3.3',
    date: '2026-02-02',
    changes: [
      { type: 'feature', text: 'Upgrade popover on collapsed planet cards (2-click upgrades!)' },
      { type: 'feature', text: 'Notification dots on planets (red=upgrades, yellow=empty slots)' },
      { type: 'feature', text: 'MAX upgrade buttons for bulk purchasing' },
      { type: 'improvement', text: 'Quick action buttons on collapsed cards (no expand needed)' },
      { type: 'improvement', text: 'Seeds button opens manager directly from collapsed view' },
    ],
  },
  {
    version: '0.3.2',
    date: '2026-02-02',
    changes: [
      { type: 'feature', text: 'In-game changelog in settings menu' },
      { type: 'improvement', text: 'Dev tools now use engine methods properly' },
      { type: 'fix', text: 'Event banner space only reserved when unlocked' },
    ],
  },
  {
    version: '0.3.1',
    date: '2026-02-02',
    changes: [
      { type: 'feature', text: 'Events section in Dev Tools panel' },
      { type: 'improvement', text: 'Event challenge targets and rewards rebalanced' },
      { type: 'fix', text: 'Challenge tracking wired to game actions' },
      { type: 'fix', text: 'Event banner click navigates to Events' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-02-02',
    changes: [
      { type: 'feature', text: 'Events system with limited-time challenges' },
      { type: 'feature', text: 'Leaderboard with global player rankings' },
      { type: 'feature', text: 'Cloud save with sync indicator' },
      { type: 'feature', text: 'Authentication UI (login/signup)' },
      { type: 'feature', text: 'Convex backend infrastructure' },
      { type: 'improvement', text: 'Major engine refactor for performance' },
      { type: 'improvement', text: 'Extracted PrestigeHandler and TranscendenceHandler' },
      { type: 'fix', text: 'Security vulnerabilities in backend fixed' },
      { type: 'fix', text: 'Integer validation for leaderboard metrics' },
    ],
  },
  {
    version: '0.2.5',
    date: '2026-02-02',
    changes: [
      { type: 'feature', text: 'URL-based section navigation with deep links' },
      { type: 'feature', text: 'TanStack Router for client-side navigation' },
      { type: 'improvement', text: 'Collapsible planet cards with jump strip' },
      { type: 'improvement', text: '404 handling with clean redirects' },
      { type: 'fix', text: 'Getting Started auto-dismisses when complete' },
      { type: 'fix', text: 'Initialize no longer overwrites in-memory state' },
    ],
  },
  {
    version: '0.2.4',
    date: '2026-02-01',
    changes: [
      { type: 'feature', text: 'Dev Tools panel with comprehensive debug controls' },
      { type: 'feature', text: 'Time controls: simulate offline progress' },
      { type: 'feature', text: 'Resource controls: add credits/crystals/essence' },
      { type: 'feature', text: 'Progression shortcuts: unlock planets, research' },
      { type: 'improvement', text: 'Error handling and confirmations in dev tools' },
      { type: 'improvement', text: 'Toast feedback for dev tool actions' },
    ],
  },
  {
    version: '0.2.3',
    date: '2026-02-01',
    changes: [
      { type: 'feature', text: 'Star Compass equipment: global manager bonus' },
      { type: 'feature', text: 'Breeding achievements with tier progression' },
      { type: 'improvement', text: 'AllBonus equipment now applies to ALL effect types' },
      { type: 'fix', text: 'Legendary trait detection in breeding' },
      { type: 'fix', text: 'Impossible achievement requirements fixed' },
    ],
  },
  {
    version: '0.2.2',
    date: '2026-02-01',
    changes: [
      { type: 'feature', text: 'Anomaly reward system extracted and improved' },
      { type: 'feature', text: 'Mysterious Bonus system for random rewards' },
      { type: 'improvement', text: 'Reward system consolidated across game' },
      { type: 'improvement', text: 'Farming system extracted from engine' },
      { type: 'improvement', text: 'Scrap system extracted from engine' },
    ],
  },
  {
    version: '0.2.1',
    date: '2026-02-01',
    changes: [
      { type: 'feature', text: 'x1, x10, x100 gacha pull buttons' },
      { type: 'improvement', text: 'Save migration system extracted' },
      { type: 'balance', text: 'Bumper harvest frequency reduced 10x' },
      { type: 'balance', text: 'Base seed slots reduced from 6 to 4' },
      { type: 'balance', text: 'Prestige threshold raised to 50k credits' },
      { type: 'balance', text: 'Progressive feature unlocks based on credits' },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-02-01',
    changes: [
      { type: 'feature', text: 'Mastery XP system with milestone bonuses' },
      { type: 'feature', text: 'Global Mastery Pool from max-level seeds' },
      { type: 'feature', text: 'Breeding system with parent selection' },
      { type: 'feature', text: 'Recipe discovery for hidden breeding combos' },
      { type: 'feature', text: 'Equipment and mod slots for seeds' },
      { type: 'feature', text: 'Supply items from expeditions' },
      { type: 'feature', text: 'Daily login rewards (7-day cycle)' },
      { type: 'feature', text: 'Breeding, Expedition, Mastery handlers' },
      { type: 'balance', text: 'Day 1 login reward adjusted to 250 credits' },
      { type: 'fix', text: 'Max-level seeds contribute to mastery pool' },
      { type: 'fix', text: 'Handler tests made deterministic' },
    ],
  },
  {
    version: '0.1.5',
    date: '2026-01-31',
    changes: [
      { type: 'feature', text: 'Space Anomalies: random clickable bonuses' },
      { type: 'feature', text: 'Anomaly types: Credit Burst, Warp Speed, Lucky Star' },
      { type: 'feature', text: 'Bumper Harvest: 5% chance for 5x yield' },
      { type: 'feature', text: 'Welcome Back modal for offline progress' },
      { type: 'improvement', text: 'Celebration animations for big moments' },
    ],
  },
  {
    version: '0.1.4',
    date: '2026-01-31',
    changes: [
      { type: 'feature', text: 'Settings panel with save export/import' },
      { type: 'feature', text: 'Stats panel with detailed game statistics' },
      { type: 'feature', text: 'Keyboard shortcuts (G: Gacha, M: Menu, etc.)' },
      { type: 'feature', text: 'Game reset with confirmation dialog' },
      { type: 'improvement', text: 'Accessibility: focus indicators, ARIA labels' },
      { type: 'improvement', text: 'Reduced motion support' },
    ],
  },
  {
    version: '0.1.3',
    date: '2026-01-31',
    changes: [
      { type: 'feature', text: 'Manager gacha with 15 unique managers' },
      { type: 'feature', text: 'Manager awakening system (5 copies = awakened)' },
      { type: 'feature', text: 'Team synergies for collection bonuses' },
      { type: 'feature', text: 'Assign managers to planets for boosts' },
      { type: 'feature', text: 'Expedition system: send managers on missions' },
      { type: 'feature', text: 'Expedition rewards: credits, essence, items' },
    ],
  },
  {
    version: '0.1.2',
    date: '2026-01-31',
    changes: [
      { type: 'feature', text: 'Daily quests with auto-reset timers' },
      { type: 'feature', text: 'Weekly quests with larger goals' },
      { type: 'feature', text: 'Daily Challenges with bonus rewards' },
      { type: 'feature', text: 'Achievement categories and milestones' },
      { type: 'feature', text: 'Onboarding hints for new players' },
      { type: 'improvement', text: 'Quest progress tracking' },
    ],
  },
  {
    version: '0.1.1',
    date: '2026-01-31',
    changes: [
      { type: 'feature', text: 'Transcendence system for late-game resets' },
      { type: 'feature', text: 'Refinement: convert plants to essence' },
      { type: 'feature', text: 'Affinity bonuses for seed-planet combos' },
      { type: 'improvement', text: 'Large number formatting' },
      { type: 'improvement', text: 'Auto-save every 30 seconds' },
      { type: 'improvement', text: 'Offline progress up to 24 hours' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-01-31',
    changes: [
      { type: 'feature', text: 'Core farming loop with 7 planets' },
      { type: 'feature', text: 'Seed gacha with Common, Uncommon, Rare tiers' },
      { type: 'feature', text: 'Fusion system: combine seeds to tier 6 Mythic' },
      { type: 'feature', text: 'Research tree with 4 tiers of upgrades' },
      { type: 'feature', text: 'Prestige system with permanent bonuses' },
      { type: 'feature', text: 'Planet upgrades: production, capacity, export' },
      { type: 'feature', text: '10 seed types: Wheat, Corn, Potato, and more' },
      { type: 'feature', text: 'Crystal shop for premium currency' },
    ],
  },
];

const typeConfig = {
  feature: { icon: Sparkles, label: 'New', color: 'bg-green-500/20 text-green-400' },
  improvement: { icon: Zap, label: 'Improved', color: 'bg-blue-500/20 text-blue-400' },
  fix: { icon: Bug, label: 'Fixed', color: 'bg-orange-500/20 text-orange-400' },
  balance: { icon: Wrench, label: 'Balance', color: 'bg-purple-500/20 text-purple-400' },
};

const Changelog: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">What's New</h3>
        <Badge variant="secondary" className="text-xs">
          v{CHANGELOG[0]?.version}
        </Badge>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6">
          {CHANGELOG.map(entry => (
            <div key={entry.version} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">v{entry.version}</span>
                <span className="text-xs text-muted-foreground">— {entry.date}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.changes.map((change, i) => {
                  const config = typeConfig[change.type];
                  const Icon = config.icon;
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge
                        variant="secondary"
                        className={cn('shrink-0 text-[10px] px-1.5 py-0', config.color)}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      <span className="text-muted-foreground">{change.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Changelog;
