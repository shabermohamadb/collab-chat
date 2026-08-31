import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.tsx';
import { Hash, Users, MessageSquare, Plus, Check } from 'lucide-react';
import * as roomService from '../../services/rooms.ts';
import { Room } from '../../types/index.ts';

interface ExploreRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoom: (room: Room) => void;
  onRoomJoined: (room: Room) => void;
}

export const ExploreRoomsModal: React.FC<ExploreRoomsModalProps> = ({
  isOpen,
  onClose,
  onSelectRoom,
  onRoomJoined,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPublicRooms();
    }
  }, [isOpen]);

  const loadPublicRooms = async () => {
    setLoading(true);
    try {
      const publicRooms = await roomService.getPublicRooms();
      setRooms(publicRooms);
    } catch (err) {
      console.error('Failed to load public rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (room: Room) => {
    setJoiningId(room.id);
    try {
      await roomService.joinRoom(room.id);
      onRoomJoined(room);
      onSelectRoom(room);
      onClose();
    } catch (err) {
      console.error('Failed to join room:', err);
    } finally {
      setJoiningId(null);
    }
  };

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Explore Channels"
      description="Discover and join public collaborative channels across your workspace."
      maxWidth="lg"
    >
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channels..."
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-colors"
        />

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-zinc-500">Loading channels...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">No channels found.</div>
          ) : (
            filtered.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <div className="flex items-center gap-1.5 font-medium text-sm text-zinc-100">
                    <Hash size={14} className="text-zinc-400 shrink-0" />
                    <span className="truncate">{room.name}</span>
                  </div>
                  {room.description && (
                    <p className="text-xs text-zinc-400 line-clamp-1">{room.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {room._count?.members || room.members?.length || 1} members
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={11} />
                      {room._count?.messages || 0} messages
                    </span>
                  </div>
                </div>

                {room.isMember ? (
                  <button
                    onClick={() => {
                      onSelectRoom(room);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium shrink-0 transition-colors"
                  >
                    <Check size={12} className="text-emerald-400" />
                    Open
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(room)}
                    disabled={joiningId === room.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shrink-0 transition-colors disabled:opacity-50"
                  >
                    <Plus size={12} />
                    {joiningId === room.id ? 'Joining...' : 'Join'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
