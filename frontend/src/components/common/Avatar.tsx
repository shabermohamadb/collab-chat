import React, { useState } from 'react';
import { UserStatus } from '../../types/index.ts';
import { getStatusColor, getAvatarUrl } from '../../utils/avatar.ts';
import { Sparkles } from 'lucide-react';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  status?: UserStatus;
  isAi?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  status = 'OFFLINE',
  isAi = false,
  size = 'md',
  showStatus = true,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-4 h-4 ring-2',
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const defaultUrl = avatarUrl || getAvatarUrl(name);

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {isAi ? (
        <div
          className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center text-teal-400 font-semibold shadow-inner`}
          title="AI Assistant"
        >
          <Sparkles className={size === 'xs' || size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        </div>
      ) : defaultUrl && !imageError ? (
        <img
          src={defaultUrl}
          alt={name}
          onError={() => setImageError(true)}
          className={`${sizeClasses[size]} rounded-lg object-cover bg-zinc-800 border border-zinc-800`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-medium text-zinc-300`}
        >
          {initials}
        </div>
      )}

      {showStatus && !isAi && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-zinc-950 ${statusDotSizes[size]} ${getStatusColor(
            status
          )}`}
          title={status}
        />
      )}
    </div>
  );
};
