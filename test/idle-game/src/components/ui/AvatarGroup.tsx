/**
 * Avatar Group
 * Display multiple avatars overlapping
 */

import React from 'react';
import { cn } from '@/lib/utils';
import Avatar from './Avatar';

interface AvatarItem {
  id: string;
  src?: string;
  name?: string;
}

interface AvatarGroupProps {
  avatars: AvatarItem[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { avatar: 'sm' as const, overlap: '-ml-2', text: 'text-xs w-8 h-8' },
  md: { avatar: 'md' as const, overlap: '-ml-3', text: 'text-sm w-10 h-10' },
  lg: { avatar: 'lg' as const, overlap: '-ml-4', text: 'text-base w-12 h-12' },
};

const AvatarGroup: React.FC<AvatarGroupProps> = ({ avatars, max = 5, size = 'md', className }) => {
  const config = sizes[size];
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((avatar, i) => (
        <Avatar
          key={avatar.id}
          src={avatar.src}
          name={avatar.name}
          size={config.avatar}
          className={cn('ring-2 ring-slate-900', i > 0 && config.overlap)}
        />
      ))}

      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full bg-slate-700 flex items-center justify-center font-medium text-white ring-2 ring-slate-900',
            config.overlap,
            config.text
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
export type { AvatarItem };
