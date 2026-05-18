/**
 * Price Tag
 * Displays a price with optional original/discounted
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface PriceTagProps {
  price: number | string;
  originalPrice?: number | string;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { price: 'text-lg', original: 'text-sm' },
  md: { price: 'text-2xl', original: 'text-base' },
  lg: { price: 'text-3xl', original: 'text-lg' },
};

const PriceTag: React.FC<PriceTagProps> = ({
  price,
  originalPrice,
  currency = '',
  size = 'md',
  className,
}) => {
  const sizeConfig = sizes[size];
  const hasDiscount = originalPrice !== undefined;

  return (
    <div className={cn('inline-flex items-baseline gap-2', className)}>
      <span className={cn(sizeConfig.price, 'font-bold text-white')}>
        {currency}
        {price}
      </span>

      {hasDiscount && (
        <span className={cn(sizeConfig.original, 'text-slate-500 line-through')}>
          {currency}
          {originalPrice}
        </span>
      )}
    </div>
  );
};

export default PriceTag;
