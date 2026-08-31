import React, { useRef, useEffect } from 'react';
import { Message, Room } from '../../types/index.ts';
import { MessageItem } from './MessageItem.tsx';
import { DateDivider } from './DateDivider.tsx';
import { EmptyChatState } from './EmptyChatState.tsx';
import { isSameDay } from '../../utils/date.ts';
import { ArrowDown, Loader2 } from 'lucide-react';

interface ChatAreaProps {
  room: Room;
  messages: Message[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
  onOpenThread: (message: Message) => void;
  onEditMessage: (messageId: string, content: string) => Promise<any>;
  onDeleteMessage: (messageId: string) => Promise<any>;
  onReact: (messageId: string, emoji: string) => Promise<any>;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  room,
  messages,
  loading,
  loadingMore,
  hasMore,
  onLoadOlder,
  onOpenThread,
  onEditMessage,
  onDeleteMessage,
  onReact,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Auto-scroll to bottom on new messages if near bottom
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Initial load scroll
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [loading, room.id]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-1 md:px-4 py-4 flex flex-col justify-between"
    >
      {/* Load more history button / spinner */}
      {hasMore && (
        <div className="py-2 text-center select-none">
          <button
            onClick={onLoadOlder}
            disabled={loadingMore}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Loading history...</span>
              </>
            ) : (
              <span>Load older messages</span>
            )}
          </button>
        </div>
      )}

      {/* Main message stream or empty state */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-teal-500" />
        </div>
      ) : messages.length === 0 ? (
        <EmptyChatState roomName={room.name} />
      ) : (
        <div className="space-y-1">
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;

            // Show date divider if message is first or on a new day
            const showDateDivider =
              index === 0 || !isSameDay(message.createdAt, prevMessage!.createdAt);

            // Group consecutive messages by same user within 5 minutes
            const isGrouped =
              !showDateDivider &&
              prevMessage?.senderId === message.senderId &&
              prevMessage?.isAiMessage === message.isAiMessage &&
              new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() <
                1000 * 60 * 5;

            return (
              <React.Fragment key={message.id}>
                {showDateDivider && <DateDivider date={message.createdAt} />}
                <MessageItem
                  message={message}
                  isGrouped={isGrouped}
                  onOpenThread={onOpenThread}
                  onEditMessage={onEditMessage}
                  onDeleteMessage={onDeleteMessage}
                  onReact={onReact}
                />
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div ref={bottomRef} className="h-2" />
    </div>
  );
};
