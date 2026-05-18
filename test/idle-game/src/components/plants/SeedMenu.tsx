/**
 * SeedMenu - Redesigned with retro-terminal aesthetic
 *
 * Tabbed interface for gacha pulls, seed inventory, and fusion.
 * Matches the AILandingPage design language.
 */

import React from 'react';
import { motion } from 'framer-motion';
import SeedInventory from './SeedInventory';
import SeedGacha from './SeedGacha';
import SeedFusion from './SeedFusion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GamePanel } from '@/components/ui/GamePanel';
import { Gamepad2, Leaf, FlaskRound, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeedMenuProps {
  defaultTab?: 'gacha' | 'inventory' | 'fusion';
  highlightPullButton?: boolean;
}

const SeedMenu: React.FC<SeedMenuProps> = ({ defaultTab = 'gacha', highlightPullButton }) => {
  return (
    <GamePanel withScanlines glowColor="rgb(34 211 238)">
      <Tabs defaultValue={defaultTab} className="w-full">
        {/* Terminal-style tab bar */}
        <div className="border-b border-slate-700/50 bg-slate-800/30">
          <div className="px-4 py-2 flex items-center justify-between">
            {/* System label */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden sm:inline">SEED_OPERATIONS</span>
              <span className="sm:hidden">SEEDS</span>
            </div>

            {/* Tab navigation */}
            <TabsList className="bg-transparent border-0 p-0 h-auto gap-1">
              <TabsTrigger
                value="gacha"
                className={cn(
                  'data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400',
                  'data-[state=active]:border-cyan-500/30 data-[state=active]:shadow-none',
                  'data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500',
                  'border border-transparent rounded-lg px-3 py-1.5',
                  'hover:text-slate-300 hover:bg-slate-800/50',
                  'transition-all duration-200 font-mono text-xs'
                )}
              >
                <Gamepad2 className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">GACHA</span>
                <span className="sm:hidden">PULL</span>
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className={cn(
                  'data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400',
                  'data-[state=active]:border-cyan-500/30 data-[state=active]:shadow-none',
                  'data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500',
                  'border border-transparent rounded-lg px-3 py-1.5',
                  'hover:text-slate-300 hover:bg-slate-800/50',
                  'transition-all duration-200 font-mono text-xs'
                )}
              >
                <Leaf className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">INVENTORY</span>
                <span className="sm:hidden">INV</span>
              </TabsTrigger>
              <TabsTrigger
                value="fusion"
                className={cn(
                  'data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400',
                  'data-[state=active]:border-cyan-500/30 data-[state=active]:shadow-none',
                  'data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500',
                  'border border-transparent rounded-lg px-3 py-1.5',
                  'hover:text-slate-300 hover:bg-slate-800/50',
                  'transition-all duration-200 font-mono text-xs'
                )}
              >
                <FlaskRound className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">FUSION</span>
                <span className="sm:hidden">FUS</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab content with animation */}
        <TabsContent value="gacha" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SeedGacha highlightPullButton={highlightPullButton} />
          </motion.div>
        </TabsContent>

        <TabsContent
          value="inventory"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SeedInventory />
          </motion.div>
        </TabsContent>

        <TabsContent
          value="fusion"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SeedFusion />
          </motion.div>
        </TabsContent>
      </Tabs>
    </GamePanel>
  );
};

export default SeedMenu;
