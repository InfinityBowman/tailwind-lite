/**
 * WelcomeModal - First-run welcome screen for new players
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket, Sparkles, Leaf, Package, Coins } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Welcome, Space Farmer!</DialogTitle>
          <DialogDescription className="text-base">
            Explore the cosmos, plant alien seeds, and build your farming empire across distant
            planets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <h4 className="font-medium text-sm text-muted-foreground text-center">How to play:</h4>

          <div className="space-y-3">
            <Step
              icon={<Sparkles className="w-5 h-5" />}
              number={1}
              title="Pull Seeds"
              description="Use credits to pull random seeds from the Gacha"
            />
            <Step
              icon={<Leaf className="w-5 h-5" />}
              number={2}
              title="Plant & Grow"
              description="Plant seeds on planets — they grow automatically"
            />
            <Step
              icon={<Package className="w-5 h-5" />}
              number={3}
              title="Export & Sell"
              description="Plants export periodically — sell them for credits"
            />
            <Step
              icon={<Coins className="w-5 h-5" />}
              number={4}
              title="Upgrade & Expand"
              description="Buy upgrades, unlock planets, research bonuses"
            />
          </div>
        </div>

        <Button onClick={onClose} size="lg" className="w-full gap-2">
          <Rocket className="w-4 h-4" />
          Start Farming
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const Step: React.FC<{
  icon: React.ReactNode;
  number: number;
  title: string;
  description: string;
}> = ({ icon, number, title, description }) => (
  <div className="flex items-start gap-3">
    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Step {number}</span>
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default WelcomeModal;
