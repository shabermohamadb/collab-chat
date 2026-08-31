import React, { useState } from 'react';
import { Room, MemberRole } from '../../types/index.ts';
import { Avatar } from '../common/Avatar.tsx';
import { Badge } from '../common/Badge.tsx';
import { usePresence } from '../../hooks/usePresence.ts';
import { useAuth } from '../../hooks/useAuth.tsx';
import * as roomService from '../../services/rooms.ts';
import { X, Users, Shield, Trash2, LogOut, Info, Edit3, Check } from 'lucide-react';

interface RoomDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onRoomUpdated: (updatedRoom: Room) => void;
  onRoomDeleted: (roomId: string) => void;
  onRoomLeft: (roomId: string) => void;
}

export const RoomDetailsDrawer: React.FC<RoomDetailsDrawerProps> = ({
  isOpen,
  onClose,
  room,
  onRoomUpdated,
  onRoomDeleted,
  onRoomLeft,
}) => {
  const { user } = useAuth();
  const { getUserStatus } = usePresence();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwner = room.currentUserRole === 'OWNER';
  const isAdminOrOwner = isOwner || room.currentUserRole === 'ADMIN';

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updated = await roomService.updateRoom(room.id, {
        name,
        description,
      });
      onRoomUpdated({ ...room, ...updated });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update channel.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this channel?')) return;
    try {
      await roomService.leaveRoom(room.id);
      onRoomLeft(room.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to leave channel.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete #${room.name}? This will remove all messages.`))
      return;
    try {
      await roomService.deleteRoom(room.id);
      onRoomDeleted(room.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to delete channel.');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-fadeIn">
      {/* Drawer Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
          <Info size={16} className="text-teal-400" />
          <span>Channel Details</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Channel Info / Editor */}
        <div>
          {isEditing ? (
            <form onSubmit={handleSaveDetails} className="space-y-3">
              {error && <div className="text-xs text-red-400">{error}</div>}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Channel Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-medium"
                >
                  <Check size={12} />
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-zinc-100">#{room.name}</h3>
                {isAdminOrOwner && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-zinc-400 hover:text-teal-400 transition-colors"
                    title="Edit Channel Details"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
              {room.description ? (
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{room.description}</p>
              ) : (
                <p className="text-xs text-zinc-500 italic mt-1">No description set.</p>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-zinc-800/80" />

        {/* Member List */}
        <div>
          <div className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              <span>Members ({room.members?.length || 1})</span>
            </span>
          </div>

          <div className="space-y-2">
            {room.members?.map((member) => {
              const liveStatus = getUserStatus(member.user.id, member.user.status);
              const isMemberOwner = member.role === 'OWNER';
              const isMemberAdmin = member.role === 'ADMIN';

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={member.user.displayName || member.user.username}
                      avatarUrl={member.user.avatarUrl}
                      status={liveStatus}
                      isAi={member.user.isAi}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">
                        {member.user.displayName}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        @{member.user.username}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isMemberOwner && (
                      <Badge variant="warning" size="sm">
                        Owner
                      </Badge>
                    )}
                    {isMemberAdmin && (
                      <Badge variant="purple" size="sm">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-zinc-800/80" />

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors border border-zinc-800"
          >
            <LogOut size={14} />
            <span>Leave Channel</span>
          </button>

          {isOwner && (
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-xs font-semibold text-red-300 transition-colors border border-red-800/60"
            >
              <Trash2 size={14} />
              <span>Delete Channel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
