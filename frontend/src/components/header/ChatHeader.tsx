import React, { useState } from 'react';
import { Room } from '../../types/index.ts';
import { Avatar } from '../common/Avatar.tsx';
import { RoomDetailsDrawer } from './RoomDetailsDrawer.tsx';
import { usePresence } from '../../hooks/usePresence.ts';
import {
  Hash,
  Lock,
  Menu,
  Info,
} from 'lucide-react';

interface ChatHeaderProps {
  room: Room;
  onToggleMobileSidebar: () => void;
  onRoomUpdated: (updatedRoom: Room) => void;
  onRoomDeleted: (roomId: string) => void;
  onRoomLeft: (roomId: string) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  room,
  onToggleMobileSidebar,
  onRoomUpdated,
  onRoomDeleted,
  onRoomLeft,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { getUserStatus } = usePresence();

  const members = room.members || [];
  const onlineCount = members.filter((m) => {
    const status = getUserStatus(m.user.id, m.user.status);
    return status === 'ONLINE';
  }).length;

  return (
    <>
      <header className="h-14 px-4 bg-[#0e0b1a]/95 backdrop-blur border-b border-[#26203d] flex items-center justify-between shrink-0 select-none z-10">
        {/* Left Side: Mobile Menu & Room Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1936] rounded-lg transition-colors"
            title="Toggle channels menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#18132c] border border-[#2e264b] text-[#9b89f5]">
              {room.isPrivate ? <Lock size={15} /> : <Hash size={15} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm text-zinc-100 truncate">{room.name}</h2>
              </div>
              {room.description ? (
                <p className="text-[11px] text-zinc-400 truncate hidden sm:block">
                  {room.description}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-500 truncate hidden sm:block">
                  Type <span className="text-[#9b89f5] font-mono font-medium">@AI</span> to ask the assistant anytime
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Online count, Member Avatars, Info Button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Online count pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18132c] border border-[#2e264b] text-[11px] text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-emerald-400">{onlineCount}</span>
            <span className="text-zinc-400">online</span>
          </div>

          {/* Member avatar stack preview */}
          <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden">
            {members.slice(0, 4).map((m) => (
              <Avatar
                key={m.id}
                name={m.user.displayName || m.user.username}
                avatarUrl={m.user.avatarUrl}
                status={getUserStatus(m.user.id, m.user.status)}
                isAi={m.user.isAi}
                size="xs"
                showStatus={false}
                className="ring-2 ring-[#0e0b1a]"
              />
            ))}
            {members.length > 4 && (
              <div className="w-5 h-5 rounded-lg bg-[#201938] text-[9px] font-semibold text-[#c4b5fd] flex items-center justify-center ring-2 ring-[#0e0b1a]">
                +{members.length - 4}
              </div>
            )}
          </div>

          {/* Details drawer toggle button */}
          <button
            onClick={() => setIsDetailsOpen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#201938] transition-colors"
            title="Channel Details"
          >
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Channel Details Drawer */}
      <RoomDetailsDrawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        room={room}
        onRoomUpdated={onRoomUpdated}
        onRoomDeleted={onRoomDeleted}
        onRoomLeft={onRoomLeft}
      />
    </>
  );
};
