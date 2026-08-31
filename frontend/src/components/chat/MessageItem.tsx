import React, { useState } from 'react';
import { Message } from '../../types/index.ts';
import { Avatar } from '../common/Avatar.tsx';
import { Badge } from '../common/Badge.tsx';
import { MarkdownRenderer } from '../../utils/markdown.tsx';
import { formatMessageTime, formatFullDateTime } from '../../utils/date.ts';
import { AttachmentPreview } from './AttachmentPreview.tsx';
import { ReactionPicker } from './ReactionPicker.tsx';
import { useAuth } from '../../hooks/useAuth.tsx';
import { usePresence } from '../../hooks/usePresence.ts';
import confetti from 'canvas-confetti';
import {
  Smile,
  MessageSquare,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isGrouped?: boolean;
  onOpenThread: (message: Message) => void;
  onEditMessage: (messageId: string, content: string) => Promise<any>;
  onDeleteMessage: (messageId: string) => Promise<any>;
  onReact: (messageId: string, emoji: string) => Promise<any>;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isGrouped = false,
  onOpenThread,
  onEditMessage,
  onDeleteMessage,
  onReact,
}) => {
  const { user } = useAuth();
  const { getUserStatus } = usePresence();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAuthor = user?.id === message.senderId;
  const senderName = message.sender?.displayName || message.sender?.username || (message.isAiMessage ? 'AI Assistant' : 'User');
  const senderStatus = message.sender ? getUserStatus(message.sender.id, message.sender.status) : 'OFFLINE';

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await onEditMessage(message.id, editContent);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReaction = async (emoji: string) => {
    try {
      if (emoji === '🎉' || emoji === '🚀') {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
      await onReact(message.id, emoji);
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  // Group reactions by emoji
  const reactionMap = (message.reactions || []).reduce<Record<string, { count: number; hasReacted: boolean; users: string[] }>>(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { count: 0, hasReacted: false, users: [] };
      }
      acc[reaction.emoji].count += 1;
      if (reaction.userId === user?.id) {
        acc[reaction.emoji].hasReacted = true;
      }
      if (reaction.user?.displayName) {
        acc[reaction.emoji].users.push(reaction.user.displayName);
      }
      return acc;
    },
    {}
  );

  return (
    <div
      className={`group relative flex gap-3 px-4 py-1.5 transition-colors hover:bg-zinc-900/40 rounded-lg ${
        message.isAiMessage ? 'bg-sky-950/10 border-l-2 border-sky-500/40 pl-3.5' : ''
      }`}
    >
      {/* Sender Avatar */}
      <div className="shrink-0 pt-0.5">
        {!isGrouped ? (
          <Avatar
            name={senderName}
            avatarUrl={message.sender?.avatarUrl}
            status={senderStatus}
            isAi={message.isAiMessage}
            size="md"
          />
        ) : (
          <div className="w-9 text-center text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 select-none transition-opacity">
            {formatMessageTime(message.createdAt)}
          </div>
        )}
      </div>

      {/* Message Content & Metadata */}
      <div className="min-w-0 flex-1">
        {!isGrouped && (
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-xs text-zinc-200 hover:underline cursor-pointer">
              {senderName}
            </span>
            {message.isAiMessage && (
              <Badge variant="ai" size="sm">
                <Sparkles size={10} />
                AI
              </Badge>
            )}
            <span
              className="text-[11px] text-zinc-400 select-none"
              title={formatFullDateTime(message.createdAt)}
            >
              {formatMessageTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Message Content or Edit Input */}
        {isEditing ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-teal-500"
              rows={3}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={message.isDeleted ? 'italic text-zinc-500 text-xs' : ''}>
            <MarkdownRenderer content={message.content} />
            {message.isEdited && !message.isDeleted && (
              <span className="text-[10px] text-zinc-500 ml-1 select-none">(edited)</span>
            )}
          </div>
        )}

        {/* File Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-1.5">
            {message.attachments.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {/* Reactions List */}
        {Object.keys(reactionMap).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {Object.entries(reactionMap).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => handleToggleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                  data.hasReacted
                    ? 'bg-teal-950/60 border-teal-700 text-teal-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
                title={data.users.join(', ')}
              >
                <span>{emoji}</span>
                <span className="text-[11px] font-medium">{data.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread reply counter pill */}
        {message.replyCount && message.replyCount > 0 ? (
          <button
            onClick={() => onOpenThread(message)}
            className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md bg-zinc-900/80 hover:bg-zinc-800 text-teal-400 hover:text-teal-300 text-xs font-medium border border-zinc-800/80 transition-colors"
          >
            <MessageSquare size={13} />
            <span>
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </span>
            <span className="text-zinc-500 text-[11px]">View thread</span>
          </button>
        ) : null}
      </div>

      {/* Floating Hover Action Bar */}
      {!message.isDeleted && (
        <div className="absolute top-1 right-3 hidden group-hover:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg py-0.5 px-1 z-20 animate-fadeIn">
          {/* Reaction Picker Button */}
          <div className="relative">
            <button
              onClick={() => setIsReactionPickerOpen(!isReactionPickerOpen)}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Add reaction"
            >
              <Smile size={14} />
            </button>
            <ReactionPicker
              isOpen={isReactionPickerOpen}
              onClose={() => setIsReactionPickerOpen(false)}
              onSelectEmoji={handleToggleReaction}
            />
          </div>

          {/* Reply in thread */}
          <button
            onClick={() => onOpenThread(message)}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Reply in thread"
          >
            <MessageSquare size={14} />
          </button>

          {/* Copy message text */}
          <button
            onClick={handleCopyText}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Copy text"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          {/* Edit (if author) */}
          {isAuthor && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Edit message"
            >
              <Edit2 size={14} />
            </button>
          )}

          {/* Delete (if author or admin) */}
          {isAuthor && (
            <button
              onClick={() => {
                if (window.confirm('Delete this message?')) {
                  onDeleteMessage(message.id);
                }
              }}
              className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
              title="Delete message"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
