import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { usePresence } from '../../hooks/usePresence.ts';
import { Avatar } from '../common/Avatar.tsx';
import { CreateRoomModal } from './CreateRoomModal.tsx';
import { ExploreRoomsModal } from './ExploreRoomsModal.tsx';
import { DirectMessageModal } from './DirectMessageModal.tsx';
import { Room } from '../../types/index.ts';
import {
  Hash,
  Lock,
  Plus,
  Compass,
  Settings,
  LogOut,
  ChevronDown,
  Search,
} from 'lucide-react';

interface SidebarProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onRoomCreated: (newRoom: Room) => void;
  onOpenSettings: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  onRoomCreated,
  onOpenSettings,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const { user, logout, updateStatus } = useAuth();
  const { getUserStatus } = usePresence();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  const [isDmModalOpen, setIsDmModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const channelRooms = rooms.filter(
    (r) => r.type === 'CHANNEL' && !r.isArchived && r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const directMessageRooms = rooms.filter(
    (r) => r.type === 'DIRECT_MESSAGE' && !r.isArchived
  );

  const currentUserStatus = user ? getUserStatus(user.id, user.status) : 'ONLINE';

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#0e0b1a] border-r border-[#26203d] flex flex-col transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#26203d] bg-[#120e22]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6a56d6] to-[#9b89f5] flex items-center justify-center text-white shadow-md font-bold text-sm">
              C
            </div>
            <div>
              <div className="font-semibold text-xs tracking-wide text-zinc-100">CollabSpace</div>
              <div className="text-[10px] text-[#9b89f5] font-medium flex items-center gap-1">
                <span>Workspace</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsExploreModalOpen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#211b38] transition-colors"
            title="Explore all channels"
          >
            <Compass size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[#26203d]/60">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter channels..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-[#140f26] border border-[#2d264a] rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
            />
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-semibold tracking-wider text-[#9b89f5]/80 uppercase">
              <span>Channels</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-0.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#211b38] transition-colors"
                  title="Create channel"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-0.5">
              {channelRooms.length === 0 ? (
                <div className="px-2 py-2 text-[11px] text-zinc-500">No channels found</div>
              ) : (
                channelRooms.map((room) => {
                  const isActive = room.id === activeRoomId;
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        onSelectRoom(room.id);
                        if (onMobileClose) onMobileClose();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#7b68ee]/20 text-[#c4b5fd] border border-[#7b68ee]/40 font-semibold shadow-sm'
                          : 'text-zinc-300 hover:bg-[#1b1530] hover:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {room.isPrivate ? (
                          <Lock size={13} className={isActive ? 'text-[#9b89f5]' : 'text-zinc-400'} />
                        ) : (
                          <Hash size={13} className={isActive ? 'text-[#9b89f5]' : 'text-zinc-400'} />
                        )}
                        <span className="truncate">{room.name}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-semibold tracking-wider text-[#9b89f5]/80 uppercase">
              <span>Direct Messages</span>
              <button
                onClick={() => setIsDmModalOpen(true)}
                className="p-0.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#211b38] transition-colors"
                title="Start Direct Message"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-0.5">
              {directMessageRooms.length === 0 ? (
                <div className="px-2 py-2 text-[11px] text-zinc-500">No active direct messages</div>
              ) : (
                directMessageRooms.map((room) => {
                  const otherMember = room.members?.find((m) => m.userId !== user?.id)?.user;
                  const displayName = otherMember?.displayName || room.name.replace('DM: ', '');
                  const otherStatus = otherMember ? getUserStatus(otherMember.id, otherMember.status) : 'OFFLINE';
                  const isActive = room.id === activeRoomId;

                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        onSelectRoom(room.id);
                        if (onMobileClose) onMobileClose();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#7b68ee]/20 text-[#c4b5fd] border border-[#7b68ee]/40 font-semibold shadow-sm'
                          : 'text-zinc-300 hover:bg-[#1b1530] hover:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          name={displayName}
                          avatarUrl={otherMember?.avatarUrl}
                          status={otherStatus}
                          size="xs"
                        />
                        <span className="truncate">{displayName}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-2 border-t border-[#26203d] bg-[#0e0b1a]">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#1a142e] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  name={user?.displayName || 'User'}
                  avatarUrl={user?.avatarUrl}
                  status={currentUserStatus}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-200 truncate">
                    {user?.displayName}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">@{user?.username}</div>
                </div>
              </div>
              <ChevronDown size={14} className="text-zinc-500" />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 p-1.5 bg-[#17122b] border border-[#2f274d] rounded-xl shadow-2xl z-50 animate-fadeIn space-y-1">
                {/* Status Switcher */}
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#9b89f5] uppercase tracking-wider">
                  Set Status
                </div>
                <div className="grid grid-cols-3 gap-1 px-1 pb-1">
                  {(['ONLINE', 'AWAY', 'OFFLINE'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        updateStatus(st);
                        setIsUserMenuOpen(false);
                      }}
                      className={`px-1.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                        currentUserStatus === st
                          ? 'bg-[#7b68ee]/30 text-[#ddd6fe] border border-[#7b68ee]/50'
                          : 'bg-[#100c1e] text-zinc-400 hover:bg-[#201938] hover:text-zinc-200'
                      }`}
                    >
                      {st === 'ONLINE' ? '🟢 Online' : st === 'AWAY' ? '🟡 Away' : '⚪ Offline'}
                    </button>
                  ))}
                </div>

                <div className="h-px bg-[#2f274d]" />

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-[#251d3f] hover:text-zinc-100 transition-colors"
                >
                  <Settings size={14} />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={(room) => {
          onRoomCreated(room);
          onSelectRoom(room.id);
        }}
      />

      <ExploreRoomsModal
        isOpen={isExploreModalOpen}
        onClose={() => setIsExploreModalOpen(false)}
        onSelectRoom={(room) => onSelectRoom(room.id)}
        onRoomJoined={(room) => onRoomCreated(room)}
      />

      <DirectMessageModal
        isOpen={isDmModalOpen}
        onClose={() => setIsDmModalOpen(false)}
        onRoomSelected={(room) => {
          onRoomCreated(room);
          onSelectRoom(room.id);
        }}
      />
    </>
  );
};
