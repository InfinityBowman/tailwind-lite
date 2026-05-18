/**
 * UserMenu - User profile dropdown in the header
 *
 * Shows:
 * - Login button when not authenticated
 * - User avatar/name + dropdown when authenticated
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Avatar from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/Skeleton';
import { Cloud, LogOut, Settings, Link as LinkIcon, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LoginDialog } from './LoginDialog';

interface UserMenuProps {
  onSettingsClick?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onSettingsClick }) => {
  const [loginOpen, setLoginOpen] = useState(false);
  const {
    isLoading,
    isAuthenticated,
    user,
    loginWithDiscord,
    loginWithGoogle,
    loginAnonymously,
    logout,
  } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  // Not authenticated - show login button
  if (!isAuthenticated || !user) {
    return (
      <>
        <Button
          onClick={() => setLoginOpen(true)}
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Sign In"
        >
          <Cloud className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sign In</span>
        </Button>

        <LoginDialog
          open={loginOpen}
          onOpenChange={setLoginOpen}
          onLoginDiscord={() => {
            setLoginOpen(false);
            loginWithDiscord();
          }}
          onLoginGoogle={() => {
            setLoginOpen(false);
            loginWithGoogle();
          }}
          onLoginAnonymous={() => {
            setLoginOpen(false);
            loginAnonymously();
          }}
        />
      </>
    );
  }

  // Authenticated - show user menu
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8 shrink-0 aspect-square rounded-full p-0 border border-slate-700/50 hover:border-cyan-500/50"
            aria-label={`User menu for ${user.displayName || 'Player'}`}
          >
            <Avatar name={user.displayName || 'Player'} size="sm" />
            {user.isAnonymous && (
              <Badge
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-3.5 px-1 text-[8px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30"
              >
                GUEST
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-44 bg-slate-900/95 backdrop-blur-sm border-slate-700/50 p-1"
        >
          {/* User info header */}
          <div className="px-2 py-1.5 mb-1 border-b border-slate-700/50">
            <div className="text-[10px] font-mono text-slate-500 uppercase">USER</div>
            <div className="text-xs font-medium truncate text-slate-200">
              {user.displayName || 'Player'}
            </div>
          </div>

          <DropdownMenuItem
            onClick={() => {
              // TODO: Navigate to shop when route exists
              console.warn('Crystal Shop not yet implemented');
            }}
            className="text-xs font-mono gap-2 cursor-pointer hover:bg-slate-800"
          >
            <ShoppingCart className="h-3 w-3 text-purple-400" aria-hidden="true" />
            <span className="text-slate-300">CRYSTAL_SHOP</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onSettingsClick?.()}
            className="text-xs font-mono gap-2 cursor-pointer hover:bg-slate-800"
          >
            <Settings className="h-3 w-3 text-slate-400" aria-hidden="true" />
            <span className="text-slate-300">SETTINGS</span>
          </DropdownMenuItem>

          {user.isAnonymous && (
            <>
              <DropdownMenuSeparator className="bg-slate-700/50" />
              <DropdownMenuItem
                onClick={() => setLoginOpen(true)}
                className="text-xs font-mono gap-2 cursor-pointer hover:bg-cyan-500/10"
              >
                <LinkIcon className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                <span className="text-cyan-400">LINK_ACCOUNT</span>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator className="bg-slate-700/50" />

          <DropdownMenuItem
            onClick={logout}
            className="text-xs font-mono gap-2 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-400"
          >
            <LogOut className="h-3 w-3" aria-hidden="true" />
            <span>LOGOUT</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Single LoginDialog instance - used for linking anonymous accounts */}
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onLoginDiscord={() => {
          setLoginOpen(false);
          loginWithDiscord();
        }}
        onLoginGoogle={() => {
          setLoginOpen(false);
          loginWithGoogle();
        }}
        onLoginAnonymous={() => {
          setLoginOpen(false);
          loginAnonymously();
        }}
      />
    </>
  );
};

export default UserMenu;
