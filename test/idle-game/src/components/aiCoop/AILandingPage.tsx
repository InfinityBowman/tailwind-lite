/**
 * AILandingPage - The "AI Co-op First" landing experience
 *
 * A bold, retro-terminal meets space opera introduction that showcases
 * the unique value prop: "Play alongside your AI companion"
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap, Link2, Terminal, Rocket, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AILandingPageProps {
  onStartPlaying: () => void;
  onConnectAI: () => void;
}

// Typewriter effect hook
function useTypewriter(text: string, speed: number = 50, delay: number = 0) {
  const [displayed, setDisplayed] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setIsComplete(false);

    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayed, isComplete };
}

// Animated grid background
const GridBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Base gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

    {/* Grid pattern */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgb(34 211 238) 1px, transparent 1px),
          linear-gradient(to bottom, rgb(34 211 238) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />

    {/* Radial glow from center */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,211,238,0.08)_0%,_transparent_70%)]" />

    {/* Scanlines */}
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
      }}
    />

    {/* Floating particles */}
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
        initial={{
          x: Math.random() * 100 + '%',
          y: '100%',
          opacity: 0,
        }}
        animate={{
          y: '-20%',
          opacity: [0, 0.8, 0],
        }}
        transition={{
          duration: 8 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 5,
          ease: 'linear',
        }}
      />
    ))}
  </div>
);

// Neural connection line animation
const NeuralLine = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
    style={{ width: '200px' }}
    initial={{ x: '-200px', opacity: 0 }}
    animate={{ x: 'calc(100vw + 200px)', opacity: [0, 1, 1, 0] }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      repeatDelay: 5 + Math.random() * 3,
      ease: 'linear',
    }}
  />
);

// Step card component
const StepCard = ({
  number,
  icon,
  title,
  description,
  delay,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="relative group"
  >
    {/* Glow effect on hover */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />

    <div className="relative bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 h-full">
      {/* Step number */}
      <div className="absolute -top-3 -left-3 w-8 h-8 bg-cyan-500 text-slate-950 rounded-lg flex items-center justify-center font-mono font-bold text-sm">
        {number}
      </div>

      {/* Icon */}
      <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 text-cyan-400">
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export const AILandingPage: React.FC<AILandingPageProps> = ({ onStartPlaying, onConnectAI }) => {
  const [showContent, setShowContent] = useState(false);

  // Main headline typewriter
  const headline = useTypewriter('NEURAL LINK ESTABLISHED', 40, 500);
  const subheadline = useTypewriter(
    'Your AI companion is ready to farm the cosmos alongside you.',
    30,
    headline.isComplete ? 200 : 99999
  );

  useEffect(() => {
    if (subheadline.isComplete) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [subheadline.isComplete]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <GridBackground />

      {/* Neural lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: `${20 + i * 15}%`, left: 0, right: 0 }}>
            <NeuralLine delay={i * 2} />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="font-bold text-lg text-slate-100">Space Farm</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            SYSTEM ONLINE
          </div>
        </header>

        {/* Hero section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          {/* AI Avatar */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-8"
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />

            {/* Inner ring */}
            <motion.div
              className="absolute -inset-2 rounded-full border-2 border-cyan-500/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />

            {/* Avatar container */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Bot className="w-12 h-12 text-slate-950" />
            </div>

            {/* Status indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
              <Zap className="w-3 h-3 text-slate-950" />
            </div>
          </motion.div>

          {/* Headline with typewriter */}
          <div className="text-center max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-mono tracking-tight">
              <span className="text-cyan-400">{headline.displayed}</span>
              {!headline.isComplete && (
                <span className="inline-block w-3 h-8 bg-cyan-400 ml-1 animate-pulse" />
              )}
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed min-h-[3.5rem]">
              {subheadline.displayed}
              {headline.isComplete && !subheadline.isComplete && (
                <span className="inline-block w-2 h-5 bg-slate-400 ml-0.5 animate-pulse" />
              )}
            </p>
          </div>

          {/* How it works section */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-4xl mt-16"
              >
                {/* Section header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-10"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50 text-sm text-slate-400 font-mono mb-4">
                    <Terminal className="w-4 h-4" />
                    HOW IT WORKS
                  </div>
                </motion.div>

                {/* Steps grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                  <StepCard
                    number={1}
                    icon={<Rocket className="w-6 h-6" />}
                    title="Start Your Farm"
                    description="Sign in and begin your space farming journey. Pull seeds, plant crops, expand across planets."
                    delay={0.1}
                  />
                  <StepCard
                    number={2}
                    icon={<Link2 className="w-6 h-6" />}
                    title="Link Your AI"
                    description="Get your connection token and configure Claude Code. One-click setup to sync your AI companion."
                    delay={0.2}
                  />
                  <StepCard
                    number={3}
                    icon={<Bot className="w-6 h-6" />}
                    title="Farm Together"
                    description="Your AI analyzes strategies, suggests moves, and plays alongside you. Watch your empire grow."
                    delay={0.3}
                  />
                </div>

                {/* CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <Button
                    size="lg"
                    onClick={onStartPlaying}
                    className={cn(
                      'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold',
                      'px-8 py-6 text-lg rounded-xl',
                      'shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30',
                      'transition-all duration-200'
                    )}
                  >
                    Start Farming
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={onConnectAI}
                    className={cn(
                      'border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5',
                      'text-slate-300 hover:text-cyan-400',
                      'px-8 py-6 text-lg rounded-xl',
                      'transition-all duration-200'
                    )}
                  >
                    <Bot className="w-5 h-5 mr-2" />
                    Connect AI First
                  </Button>
                </motion.div>

                {/* Feature highlights */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Real-time sync
                  </div>
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-500" />
                    AI-powered strategies
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    50+ game actions
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-sm text-slate-600 font-mono">
          <span className="opacity-50">//</span> Built for humans and AI companions alike
        </footer>
      </div>
    </div>
  );
};

export default AILandingPage;
