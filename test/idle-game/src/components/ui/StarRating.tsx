/**
 * Star Rating
 * Display star ratings (read-only)
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0-5
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  className,
}) => {
  return (
    <div
      className={cn('inline-flex gap-0.5', className)}
      role="img"
      aria-label={`${rating} out of ${maxStars} stars`}
    >
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;

        return (
          <Star
            key={i}
            className={cn(
              sizes[size],
              filled
                ? 'text-yellow-400 fill-yellow-400'
                : partial
                  ? 'text-yellow-400 fill-yellow-400/50'
                  : 'text-slate-600'
            )}
          />
        );
      })}
    </div>
  );
};

export default StarRating;
