import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Settings, Gem, Sparkles, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CurrencyIcon } from '@/components/ui';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { CloudSyncIndicator, UserMenu } from '@/components/auth';
import { AISetupDialog } from '@/components/aiCoop';

interface HeaderProps {
  credits: number;
  crystals: number;
  seedEssence: number;
  refinedEssence: number;
  sidebarCollapsed: boolean;
  onSettingsClick?: () => void;
  incomeRate?: number;
  hasActiveEvent?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return Math.floor(num).toLocaleString();
}

export const Header: React.FC<HeaderProps> = ({
  credits,
  crystals,
  seedEssence,
  refinedEssence,
  sidebarCollapsed,
  onSettingsClick,
  incomeRate = 0,
  hasActiveEvent = false,
}) => {
  const [showAISetup, setShowAISetup] = useState(false);
  const animatedCredits = useAnimatedValue(credits, incomeRate, { min: 0, precision: 0 });

  return (
    <>
      <header
        className={cn(
          'fixed right-0 h-14 bg-card/95 backdrop-blur-sm border-b border-border z-30 transition-all duration-300',
          // Mobile: full width (no sidebar)
          'left-0',
          // Desktop: offset by sidebar
          sidebarCollapsed ? 'lg:left-16' : 'lg:left-56',
          hasActiveEvent ? 'top-10' : 'top-0'
        )}
      >
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Left: Title or breadcrumb */}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold hidden sm:block">Space Farming Simulator</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs text-muted-foreground cursor-help">
                  v0.3.7
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Keyboard Shortcuts</p>
                <p className="text-xs text-muted-foreground mt-1">
                  P/G/R/Q/E/A for navigation, Ctrl+S to save
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Right: Currencies */}
          <div className="flex items-center gap-4">
            {/* Credits - Animated with continuous rate */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <CurrencyIcon type="credits" size={18} />
                  <span className="font-semibold text-yellow-400 tabular-nums">
                    {formatNumber(animatedCredits)}
                  </span>
                  {incomeRate > 0 && (
                    <span className="text-xs text-green-400/70 tabular-nums hidden sm:inline">
                      +${formatNumber(incomeRate)}/s
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">
                  {Math.floor(animatedCredits).toLocaleString()} Credits
                </p>
                {incomeRate > 0 && (
                  <p className="text-xs text-green-400">+${incomeRate.toFixed(1)}/sec income</p>
                )}
                <p className="text-xs text-muted-foreground">Used for gacha, upgrades, planets</p>
              </TooltipContent>
            </Tooltip>

            {/* Crystals */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <Gem className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-purple-400 tabular-nums">{crystals}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{crystals} Crystals</p>
                <p className="text-xs text-muted-foreground">Premium currency for shop items</p>
              </TooltipContent>
            </Tooltip>

            {/* Seed Essence */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-blue-400 tabular-nums">
                    {Math.floor(seedEssence)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{seedEssence.toFixed(1)} Seed Essence</p>
                <p className="text-xs text-muted-foreground">Used for fusion</p>
              </TooltipContent>
            </Tooltip>

            {/* Refined Essence */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <CurrencyIcon type="essence" size={18} />
                  <span className="font-semibold text-purple-400 tabular-nums">
                    {refinedEssence}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{refinedEssence} Refined Essence</p>
                <p className="text-xs text-muted-foreground">Used for research</p>
              </TooltipContent>
            </Tooltip>

            {/* AI Co-op Quick Access */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAISetup(true)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Bot className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">AI Companion</p>
                <p className="text-xs text-muted-foreground">Connect Claude to play with you</p>
              </TooltipContent>
            </Tooltip>

            {/* Cloud Sync Status */}
            <CloudSyncIndicator />

            {/* User Menu (Auth) */}
            <UserMenu onSettingsClick={onSettingsClick} />

            {/* Settings */}
            <Button variant="ghost" size="icon" onClick={onSettingsClick} className="ml-2">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* AI Setup Dialog */}
        <AISetupDialog open={showAISetup} onOpenChange={setShowAISetup} />
      </header>
    </>
  );
};

export default Header;
