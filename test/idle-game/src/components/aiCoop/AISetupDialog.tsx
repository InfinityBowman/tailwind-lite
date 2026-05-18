/**
 * AISetupDialog - Quick setup wizard for AI connection
 *
 * A streamlined modal that guides users through connecting their AI companion.
 * Can be triggered from the landing page or the header.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Zap,
  ExternalLink,
  Sparkles,
  Shield,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/convex';

interface AISetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SetupStep = 'intro' | 'auth' | 'token' | 'config' | 'done';

// Step indicator
const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'h-1.5 rounded-full transition-all duration-300',
          i === current
            ? 'w-6 bg-cyan-400'
            : i < current
              ? 'w-1.5 bg-cyan-400/50'
              : 'w-1.5 bg-slate-700'
        )}
      />
    ))}
  </div>
);

// Copy button component
const CopyField = ({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-slate-500 font-mono uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono text-cyan-400 truncate">
          {value.length > 40 ? value.slice(0, 20) + '...' + value.slice(-16) : value}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className={cn(
            'shrink-0 h-10 px-3 border-slate-700',
            copied ? 'border-emerald-500/50 text-emerald-400' : 'hover:border-cyan-500/50'
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export const AISetupDialog: React.FC<AISetupDialogProps> = ({ open, onOpenChange }) => {
  const { isAuthenticated, loginAnonymously, loginWithDiscord, loginWithGoogle } = useAuth();
  const [step, setStep] = useState<SetupStep>('intro');
  const [token, setToken] = useState<string | null>(null);
  const [configCopied, setConfigCopied] = useState(false);

  const convexUrl = import.meta.env.VITE_CONVEX_URL || '';

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep(isAuthenticated ? 'token' : 'intro');
      setToken(null);
      setConfigCopied(false);
    }
  }, [open, isAuthenticated]);

  // Auto-advance when authenticated
  useEffect(() => {
    if (isAuthenticated && step === 'auth') {
      setStep('token');
    }
  }, [isAuthenticated, step]);

  // Fetch token when on token step
  useEffect(() => {
    if (step === 'token' && isAuthenticated && !token && authClient) {
      authClient.getSession().then(session => {
        if (session?.data?.session?.token) {
          setToken(session.data.session.token);
        }
      });
    }
  }, [step, isAuthenticated, token]);

  const getMCPConfig = useCallback(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            'idle-game': {
              command: 'npx',
              args: ['tsx', 'mcp-server/index.ts'],
              cwd: '/path/to/idle-game',
              env: {
                CONVEX_URL: convexUrl,
                MCP_CONVEX_TOKEN: token || 'YOUR_TOKEN_HERE',
              },
            },
          },
        },
        null,
        2
      ),
    [token, convexUrl]
  );

  const handleCopyConfig = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getMCPConfig());
      setConfigCopied(true);
      setTimeout(() => setConfigCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [getMCPConfig]);

  const steps: SetupStep[] = ['intro', 'auth', 'token', 'config', 'done'];
  const currentIndex = steps.indexOf(step);

  const nextStep = () => {
    const next = steps[currentIndex + 1];
    if (next) setStep(next);
  };

  const prevStep = () => {
    const prev = steps[currentIndex - 1];
    if (prev) setStep(prev);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 p-0 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent" />

          <DialogHeader className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
              <StepIndicator current={currentIndex} total={steps.length} />
            </div>
            <DialogTitle className="text-xl text-slate-100">Connect Your AI Companion</DialogTitle>
            <DialogDescription className="text-slate-400">
              {step === 'intro' && 'Set up Claude Code to farm alongside you'}
              {step === 'auth' && 'Sign in to generate your connection token'}
              {step === 'token' && 'Your unique credentials for AI connection'}
              {step === 'config' && 'Add this configuration to Claude Code'}
              {step === 'done' && 'Your AI companion is ready to connect'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[280px]">
          <AnimatePresence mode="wait">
            {/* Intro Step */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <Feature
                    icon={<Zap className="w-4 h-4" />}
                    title="Real-time Sync"
                    description="Your AI plays on the same account, sharing progress instantly"
                  />
                  <Feature
                    icon={<Terminal className="w-4 h-4" />}
                    title="50+ Game Actions"
                    description="Plant seeds, pull gacha, manage expeditions, and more"
                  />
                  <Feature
                    icon={<Sparkles className="w-4 h-4" />}
                    title="AI Strategies"
                    description="Let Claude analyze and optimize your farming empire"
                  />
                </div>

                <Button
                  onClick={nextStep}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                >
                  Get Started
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Auth Step */}
            {step === 'auth' && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-slate-800/50 rounded-lg p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-300">
                      Sign in to generate a secure token that links your AI companion to your
                      account.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={loginWithDiscord}
                    className="w-full h-11 border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Continue with Discord
                  </Button>

                  <Button
                    variant="outline"
                    onClick={loginWithGoogle}
                    className="w-full h-11 border-slate-700 hover:border-red-500/50 hover:bg-red-500/5"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-2 text-slate-600">or</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      loginAnonymously();
                      nextStep();
                    }}
                    className="w-full text-slate-400 hover:text-slate-200"
                  >
                    Continue as Guest
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Token Step */}
            {step === 'token' && (
              <motion.div
                key="token"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <CopyField value={convexUrl} label="Convex URL" />
                {token ? (
                  <CopyField value={token} label="Auth Token" />
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 font-mono uppercase tracking-wide">
                      Auth Token
                    </label>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-500">
                      Loading token...
                    </div>
                  </div>
                )}

                <Button
                  onClick={nextStep}
                  disabled={!token}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold disabled:opacity-50"
                >
                  Next: Configure Claude Code
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Config Step */}
            {step === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="relative">
                  <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-400 overflow-x-auto max-h-40">
                    {getMCPConfig()}
                  </pre>
                </div>

                <Button
                  variant="outline"
                  onClick={handleCopyConfig}
                  className={cn(
                    'w-full border-slate-700',
                    configCopied
                      ? 'border-emerald-500/50 text-emerald-400'
                      : 'hover:border-cyan-500/50'
                  )}
                >
                  {configCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" /> Copy Full Config
                    </>
                  )}
                </Button>

                <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 space-y-1">
                  <p>
                    1. Open <code className="text-cyan-400">~/.claude/settings.json</code>
                  </p>
                  <p>2. Paste this configuration</p>
                  <p>3. Restart Claude Code</p>
                </div>

                <Button
                  onClick={nextStep}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                >
                  Done
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Done Step */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/25"
                >
                  <Check className="w-10 h-10 text-slate-950" />
                </motion.div>

                <h3 className="text-xl font-semibold text-slate-100 mb-2">Setup Complete!</h3>
                <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                  Your AI companion is configured. Launch Claude Code and start farming together.
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                  >
                    Start Farming
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() =>
                      window.open('https://github.com/anthropics/claude-code', '_blank')
                    }
                    className="w-full text-slate-400 hover:text-slate-200"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Get Claude Code
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with back button */}
        {step !== 'intro' && step !== 'done' && (
          <div className="px-6 pb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              className="text-slate-500 hover:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Feature highlight component
const Feature = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400 shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-sm font-medium text-slate-200">{title}</h4>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  </div>
);

export default AISetupDialog;
