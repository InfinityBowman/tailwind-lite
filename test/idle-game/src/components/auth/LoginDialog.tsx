/**
 * LoginDialog - Modal for user authentication
 *
 * Offers multiple login options:
 * - Discord OAuth (primary)
 * - Google OAuth (alternative)
 * - Anonymous (play without account)
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Cloud, Gamepad2 } from 'lucide-react';
import { DiscordIcon, GoogleIcon } from '@/components/icons';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginDiscord: () => void;
  onLoginGoogle: () => void;
  onLoginAnonymous: () => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({
  open,
  onOpenChange,
  onLoginDiscord,
  onLoginGoogle,
  onLoginAnonymous,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 font-mono text-cyan-400">
            <Cloud className="w-4 h-4" aria-hidden="true" />
            SYSTEM_LOGIN
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-500 font-mono">
            // Enable cloud saves & leaderboards
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-3">
          {/* Discord - Primary */}
          <Button
            onClick={onLoginDiscord}
            className="w-full gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white h-9 text-sm font-mono"
          >
            <DiscordIcon className="w-4 h-4" />
            DISCORD
          </Button>

          {/* Google - Secondary */}
          <Button
            onClick={onLoginGoogle}
            variant="outline"
            className="w-full gap-2 h-9 text-sm font-mono border-slate-700 hover:bg-slate-800 hover:border-slate-600"
          >
            <GoogleIcon className="w-4 h-4" />
            GOOGLE
          </Button>

          <div className="relative my-1">
            <Separator className="bg-slate-700/50" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-2 text-[10px] text-slate-600 font-mono">
              OR
            </span>
          </div>

          {/* Anonymous - Fallback */}
          <Button
            onClick={onLoginAnonymous}
            variant="ghost"
            className="w-full gap-2 h-8 text-xs font-mono text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
          >
            <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
            PLAY_AS_GUEST
          </Button>
        </div>

        <div className="text-[10px] text-slate-600 text-center font-mono space-y-0.5 border-t border-slate-700/50 pt-3">
          <p>// Local save always enabled</p>
          <p>// Sign in for cross-device sync</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
