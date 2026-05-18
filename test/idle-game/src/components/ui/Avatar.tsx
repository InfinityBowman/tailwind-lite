/**
 * Avatar Component
 * User/entity avatar with fallback
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string; // For initials fallback
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'size-8 min-w-8 min-h-8 text-xs',
  md: 'size-10 min-w-10 min-h-10 text-sm',
  lg: 'size-12 min-w-12 min-h-12 text-base',
  xl: 'size-16 min-w-16 min-h-16 text-lg',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, name, size = 'md', className }) => {
  const [imageError, setImageError] = React.useState(false);

  const showImage = src && !imageError;
  const showInitials = !showImage && name;
  const showIcon = !showImage && !name;

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-slate-700 flex items-center justify-center',
        sizes[size],
        className
      )}
    >
      {showImage && (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {showInitials && <span className="font-medium text-white">{getInitials(name)}</span>}

      {showIcon && <User className={cn('text-slate-400', iconSizes[size])} />}
    </div>
  );
};

export default Avatar;
