import React, { useRef, useEffect } from 'react';
import { User } from '../../types/index.ts';
import { Avatar } from '../common/Avatar.tsx';
import { Sparkles } from 'lucide-react';

interface MentionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  members: Array<{ user: User }>;
  onSelectMention: (username: string) => void;
}

export const MentionMenu: React.FC<MentionMenuProps> = ({
  isOpen,
  onClose,
  query,
  members,
  onSelectMention,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Options list: @AI is first
  const aiOption = {
    id: 'ai',
    username: 'AI',
    displayName: 'AI Assistant',
    isAi: true,
    avatarUrl: null,
    status: 'ONLINE' as const,
  };

  const cleanQuery = query.toLowerCase().replace('@', '');

  const memberUsers = members.map((m) => m.user).filter((u) => !u.isAi);
  const allOptions = [aiOption, ...memberUsers];

  const filtered = allOptions.filter(
    (u) =>
      u.username.toLowerCase().includes(cleanQuery) ||
      u.displayName.toLowerCase().includes(cleanQuery)
  );

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-3 mb-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-30 animate-fadeIn"
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80">
        Mention Teammate or AI
      </div>
      <div className="max-h-48 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-xs text-zinc-500">No matching members</div>
        ) : (
          filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectMention(user.username)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
            >
              {user.isAi ? (
                <div className="w-6 h-6 rounded bg-sky-950 text-sky-400 flex items-center justify-center">
                  <Sparkles size={13} />
                </div>
              ) : (
                <Avatar
                  name={user.displayName || user.username}
                  avatarUrl={user.avatarUrl}
                  status={user.status}
                  size="xs"
                />
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-200 group-hover:text-teal-400 truncate">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">@{user.username}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
