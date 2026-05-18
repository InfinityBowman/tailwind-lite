import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
        outline: 'text-foreground',
        // Tier variants for seeds
        tier1: 'border-gray-500 bg-gray-800 text-gray-300',
        tier2: 'border-green-500 bg-green-900/50 text-green-400',
        tier3: 'border-blue-500 bg-blue-900/50 text-blue-400',
        tier4: 'border-purple-500 bg-purple-900/50 text-purple-400',
        tier5: 'border-orange-500 bg-orange-900/50 text-orange-400',
        tier6: 'border-yellow-500 bg-yellow-900/50 text-yellow-400 animate-pulse',
        // Resource variants
        credits: 'border-yellow-500 bg-yellow-900/30 text-yellow-400',
        essence: 'border-blue-500 bg-blue-900/30 text-blue-400',
        refined: 'border-purple-500 bg-purple-900/30 text-purple-400',
        prestige: 'border-amber-500 bg-amber-900/30 text-amber-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
