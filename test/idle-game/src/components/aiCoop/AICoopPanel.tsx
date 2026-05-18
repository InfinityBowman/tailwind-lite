/**
 * AICoopPanel - Connection hub for linking AI companions
 *
 * Shows connection status, token management, and recent AI actions.
 * Styled with the retro-terminal aesthetic to match the landing page.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/convex';

interface AIAction {
  timestamp: number;
  action: string;
  result?: string;
}

// Simulated recent AI actions - in production, these would come from Convex
const SAMPLE_ACTIONS: AIAction[] = [
  { timestamp: Date.now() - 30000, action: 'gacha_pull', result: 'Cosmic Bloom (Rare)' },
  { timestamp: Date.now() - 60000, action: 'plant_seed', result: 'Slot 3 on Terra Prime' },
  { timestamp: Date.now() - 120000, action: 'harvest_all', result: '+2,450 credits' },
  { timestamp: Date.now() - 180000, action: 'upgrade_planet', result: 'Terra Prime Lv. 5' },
];

// Token display component with copy functionality
const TokenDisplay = ({
  token,
  label,
  isSecret = false,
}: {
  token: string;
  label: string;
  isSecret?: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!isSecret);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [token]);

  const displayValue = revealed ? token : token.slice(0, 8) + '...' + token.slice(-4);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-mono uppercase tracking-wide">{label}</span>
        {isSecret && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRevealed(!revealed)}
            className="h-6 px-2 text-slate-500 hover:text-slate-300"
          >
            {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm font-mono text-cyan-400 truncate">
          {displayValue}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className={cn(
            'shrink-0 border-slate-700 hover:border-cyan-500/50',
            copied && 'border-emerald-500/50 text-emerald-400'
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

// MCP Config code block
const MCPConfigBlock = ({ convexUrl, token }: { convexUrl: string; token: string }) => {
  const [copied, setCopied] = useState(false);

  const config = JSON.stringify(
    {
      mcpServers: {
        'idle-game': {
          command: 'npx',
          args: ['tsx', 'mcp-server/index.ts'],
          cwd: '/path/to/idle-game',
          env: {
            CONVEX_URL: convexUrl,
            MCP_CONVEX_TOKEN: token,
          },
        },
      },
    },
    null,
    2
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [config]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Claude Code MCP Config</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className={cn(
            'h-7 px-3 text-xs border-slate-700 hover:border-cyan-500/50',
            copied && 'border-emerald-500/50 text-emerald-400'
          )}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" /> Copy Config
            </>
          )}
        </Button>
      </div>

      <div className="relative">
        <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-400 overflow-x-auto max-h-48">
          {config}
        </pre>
        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none rounded-b-lg" />
      </div>

      <p className="text-xs text-slate-500">
        Add this to your <code className="text-cyan-400">~/.claude/settings.json</code> file, then
        restart Claude Code.
      </p>
    </div>
  );
};

// Action log entry
const ActionEntry = ({ action }: { action: AIAction }) => {
  const timeAgo = Math.floor((Date.now() - action.timestamp) / 1000);
  const timeStr =
    timeAgo < 60
      ? `${timeAgo}s ago`
      : timeAgo < 3600
        ? `${Math.floor(timeAgo / 60)}m ago`
        : `${Math.floor(timeAgo / 3600)}h ago`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 py-2"
    >
      <div className="w-6 h-6 bg-cyan-500/10 rounded flex items-center justify-center shrink-0 mt-0.5">
        <Terminal className="w-3 h-3 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono text-slate-200">{action.action}</code>
          <span className="text-xs text-slate-600">{timeStr}</span>
        </div>
        {action.result && <p className="text-xs text-slate-500 mt-0.5 truncate">{action.result}</p>}
      </div>
    </motion.div>
  );
};

export const AICoopPanel: React.FC = () => {
  const { user: _user, isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [recentActions] = useState<AIAction[]>(SAMPLE_ACTIONS);

  // Connection status simulation - in production, check actual connection
  const [isConnected] = useState(false);
  const [lastSeen] = useState<number | null>(null);

  // Get Convex URL from environment
  const convexUrl = import.meta.env.VITE_CONVEX_URL || '';

  // Fetch session token
  const fetchToken = useCallback(async () => {
    if (!authClient || !isAuthenticated) return;

    setIsLoadingToken(true);
    try {
      // Get the session which includes the token
      const session = await authClient.getSession();
      if (session?.data?.session?.token) {
        setToken(session.data.session.token);
      }
    } catch (err) {
      console.error('Failed to fetch token:', err);
    } finally {
      setIsLoadingToken(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !token) {
      fetchToken();
    }
  }, [isAuthenticated, token, fetchToken]);

  if (!isAuthenticated) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Sign in to Connect AI</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Create an account or sign in to get your AI connection token and start farming together.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* AI Avatar */}
              <div className="relative">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    isConnected ? 'bg-gradient-to-br from-cyan-500 to-teal-600' : 'bg-slate-800'
                  )}
                >
                  <Bot
                    className={cn('w-6 h-6', isConnected ? 'text-slate-950' : 'text-slate-500')}
                  />
                </div>
                <div
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-900',
                    isConnected ? 'bg-emerald-500' : 'bg-slate-600'
                  )}
                />
              </div>

              <div>
                <h3 className="font-semibold text-slate-200">AI Companion</h3>
                <p className="text-sm text-slate-500">
                  {isConnected ? (
                    <span className="text-emerald-400">Connected and active</span>
                  ) : (
                    'Waiting for connection...'
                  )}
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(
                'font-mono text-xs',
                isConnected
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  : 'border-slate-700 text-slate-500'
              )}
            >
              {isConnected ? (
                <>
                  <Activity className="w-3 h-3 mr-1" /> ONLINE
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" /> OFFLINE
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        {isConnected && lastSeen && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Last active: {new Date(lastSeen).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Connection Token Card */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-200">Connection Credentials</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Use these to configure Claude Code MCP integration
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Convex URL */}
          <TokenDisplay token={convexUrl} label="Convex URL" />

          <Separator className="bg-slate-800" />

          {/* Auth Token */}
          {token ? (
            <TokenDisplay token={token} label="Auth Token" isSecret />
          ) : (
            <div className="space-y-2">
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wide">
                Auth Token
              </span>
              <Button
                variant="outline"
                onClick={fetchToken}
                disabled={isLoadingToken}
                className="w-full border-slate-700 hover:border-cyan-500/50"
              >
                {isLoadingToken ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Token
                  </>
                )}
              </Button>
            </div>
          )}

          <Separator className="bg-slate-800" />

          {/* MCP Config Section */}
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowConfig(!showConfig)}
              className="w-full justify-between text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 -mx-2 px-2"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                MCP Configuration
              </span>
              {showConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            <AnimatePresence>
              {showConfig && token && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <MCPConfigBlock convexUrl={convexUrl} token={token} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Recent AI Actions */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-slate-200">Recent AI Actions</h3>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-500">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View full action log</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent>
          {recentActions.length > 0 ? (
            <div className="divide-y divide-slate-800/50">
              {recentActions.slice(0, 5).map((action, i) => (
                <ActionEntry key={i} action={action} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Terminal className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No recent actions</p>
              <p className="text-xs text-slate-600 mt-1">
                Actions will appear here when your AI companion is connected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help text */}
      <p className="text-xs text-slate-600 text-center">
        Need help? Check the{' '}
        <a href="#" className="text-cyan-400 hover:text-cyan-300 underline">
          setup guide
        </a>{' '}
        or join our{' '}
        <a href="#" className="text-cyan-400 hover:text-cyan-300 underline">
          Discord
        </a>
        .
      </p>
    </div>
  );
};

export default AICoopPanel;
