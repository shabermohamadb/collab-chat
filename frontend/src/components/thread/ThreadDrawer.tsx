import React, { useState, useEffect } from 'react';
import { Message, Room } from '../../types/index.ts';
import { MessageItem } from '../chat/MessageItem.tsx';
import { MessageComposer } from '../composer/MessageComposer.tsx';
import * as messageService from '../../services/messages.ts';
import { X, MessageSquare, Loader2 } from 'lucide-react';

interface ThreadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rootMessage: Message | null;
  room: Room;
  onEditMessage: (messageId: string, content: string) => Promise<any>;
  onDeleteMessage: (messageId: string) => Promise<any>;
  onReact: (messageId: string, emoji: string) => Promise<any>;
}

export const ThreadDrawer: React.FC<ThreadDrawerProps> = ({
  isOpen,
  onClose,
  rootMessage,
  room,
  onEditMessage,
  onDeleteMessage,
  onReact,
}) => {
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && rootMessage) {
      loadReplies(rootMessage.id);
    }
  }, [isOpen, rootMessage]);

  const loadReplies = async (messageId: string) => {
    setLoading(true);
    try {
      const data = await messageService.getThreadReplies(messageId);
      setReplies(data.replies);
    } catch (err) {
      console.error('Failed to load thread replies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (content: string, attachmentIds?: string[]) => {
    if (!rootMessage) return;
    const reply = await messageService.sendMessage({
      roomId: room.id,
      content,
      parentMessageId: rootMessage.id,
      attachmentIds,
    });
    setReplies((prev) => [...prev, reply]);
  };

  if (!isOpen || !rootMessage) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-fadeIn">
      {/* Thread Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
          <MessageSquare size={16} className="text-teal-400" />
          <span>Thread Discussion</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Root Message */}
        <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <MessageItem
            message={rootMessage}
            onOpenThread={() => {}}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onReact={onReact}
          />
        </div>

        {/* Replies divider */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium px-2">
          <span>
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Replies list */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 size={20} className="animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {replies.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                onOpenThread={() => {}}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                onReact={onReact}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reply Composer */}
      <MessageComposer
        room={room}
        parentMessageId={rootMessage.id}
        onSendMessage={handleSendReply}
        placeholder="Reply to thread..."
      />
    </div>
  );
};
