import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.tsx';
import { Avatar } from '../common/Avatar.tsx';
import * as authService from '../../services/auth.ts';
import * as roomService from '../../services/rooms.ts';
import { User, Room } from '../../types/index.ts';
import { Search, MessageSquare } from 'lucide-react';
import { usePresence } from '../../hooks/usePresence.ts';

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomSelected: (room: Room) => void;
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  isOpen,
  onClose,
  onRoomSelected,
}) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const { getUserStatus } = usePresence();

  useEffect(() => {
    if (isOpen) {
      handleSearch('');
    }
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const results = await authService.searchUsers(query);
      setUsers(results);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (targetUser: User) => {
    setSubmittingId(targetUser.id);
    try {
      const dmRoom = await roomService.getOrCreateDirectMessage(targetUser.id);
      onRoomSelected(dmRoom);
      onClose();
    } catch (err) {
      console.error('Failed to create direct message:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Direct Messages"
      description="Start a private direct conversation with a colleague."
    >
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search colleagues by name or username..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="py-6 text-center text-xs text-zinc-500">Searching colleagues...</div>
          ) : users.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">No teammates found.</div>
          ) : (
            users.map((u) => {
              const liveStatus = getUserStatus(u.id, u.status);
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  disabled={submittingId === u.id}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/80 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={u.displayName || u.username}
                      avatarUrl={u.avatarUrl}
                      status={liveStatus}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-teal-400 transition-colors truncate">
                        {u.displayName}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">@{u.username}</div>
                    </div>
                  </div>
                  <MessageSquare
                    size={14}
                    className="text-zinc-500 group-hover:text-zinc-300 transition-colors"
                  />
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
