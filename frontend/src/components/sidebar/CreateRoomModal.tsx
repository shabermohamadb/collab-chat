import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { Hash, Lock, Plus } from 'lucide-react';
import * as roomService from '../../services/rooms.ts';
import { Room } from '../../types/index.ts';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (newRoom: Room) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Room name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newRoom = await roomService.createRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
      });

      onRoomCreated(newRoom);
      setName('');
      setDescription('');
      setIsPrivate(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a collaborative channel"
      description="Channels are where your team discusses projects, features, and topics."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Channel Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              #
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. tournament-website-plan"
              className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Description <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What is this channel about?"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#201938] text-[#9b89f5]">
              {isPrivate ? <Lock size={16} /> : <Hash size={16} />}
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-200">
                {isPrivate ? 'Private Channel' : 'Public Channel'}
              </div>
              <div className="text-[11px] text-zinc-400">
                {isPrivate
                  ? 'Only invited team members can view and join.'
                  : 'Anyone in the workspace can view and join.'}
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7b68ee]"></div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7b68ee] hover:bg-[#6a56d6] text-white text-xs font-semibold shadow-[0_4px_15px_rgba(123,104,238,0.3)] transition-all disabled:opacity-50"
          >
            <Plus size={14} />
            {loading ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
