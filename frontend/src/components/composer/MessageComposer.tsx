import React, { useState, useRef, useEffect } from 'react';
import { Room } from '../../types/index.ts';
import { MentionMenu } from './MentionMenu.tsx';
import { EmojiPickerModal } from './EmojiPickerModal.tsx';
import { TypingIndicator } from './TypingIndicator.tsx';
import { useTyping } from '../../hooks/useTyping.ts';
import * as messageService from '../../services/messages.ts';
import {
  Send,
  Paperclip,
  Smile,
  Code,
  Bold,
  Italic,
  Sparkles,
  X,
  FileText,
  Loader2,
} from 'lucide-react';

interface MessageComposerProps {
  room: Room;
  onSendMessage: (content: string, attachmentIds?: string[]) => Promise<any>;
  placeholder?: string;
  parentMessageId?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  room,
  onSendMessage,
  placeholder,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Array<{ id: string; fileName: string; fileUrl: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [sending, setSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { typers, sendTyping, stopTyping } = useTyping(room.id);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [content]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    sendTyping();

    // Check for '@' mention trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtMatch = textBeforeCursor.match(/@(\w*)$/);

    if (lastAtMatch) {
      setIsMentionOpen(true);
      setMentionQuery(lastAtMatch[0]);
    } else {
      setIsMentionOpen(false);
    }
  };

  const handleSelectMention = (username: string) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);

    const replaced = textBeforeCursor.replace(/@\w*$/, `@${username} `);
    setContent(replaced + textAfterCursor);
    setIsMentionOpen(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    setSending(true);
    stopTyping();

    try {
      await onSendMessage(
        trimmed,
        attachments.map((a) => a.id)
      );
      setContent('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await messageService.uploadAttachment(file, room.id);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err: any) {
      alert(err.message || 'File upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = content.slice(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = content.slice(0, start) + replacement + content.slice(end);
    setContent(newContent);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + prefix.length,
          start + prefix.length + (selected.length || 4)
        );
      }
    }, 50);
  };

  return (
    <div className="p-3 bg-[#0e0b1a] border-t border-[#26203d] relative">
      {/* Typing Indicators */}
      <TypingIndicator typers={typers} />

      {/* Mention Dropdown */}
      <MentionMenu
        isOpen={isMentionOpen}
        onClose={() => setIsMentionOpen(false)}
        query={mentionQuery}
        members={room.members || []}
        onSelectMention={handleSelectMention}
      />

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={isEmojiOpen}
        onClose={() => setIsEmojiOpen(false)}
        onSelectEmoji={(emoji) => setContent((prev) => prev + emoji)}
      />

      {/* Attachment Previews in Composer */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-[#17122b] rounded-lg border border-[#2f274d]">
          {attachments.map((att, idx) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#201938] border border-[#3b325c] text-xs text-zinc-200"
            >
              <FileText size={13} className="text-[#9b89f5]" />
              <span className="truncate max-w-[120px]">{att.fileName}</span>
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-zinc-400 hover:text-red-400"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-2xl border border-[#2e264b] bg-[#140f26] focus-within:border-[#7b68ee] focus-within:ring-1 focus-within:ring-[#7b68ee] transition-all shadow-md">
        {/* Formatting Toolbar */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-[#251d3d] text-zinc-400">
          <div className="flex items-center gap-1">
            <button
              onClick={() => insertFormatting('**')}
              className="p-1 rounded hover:bg-[#201938] hover:text-zinc-200 transition-colors"
              title="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => insertFormatting('*')}
              className="p-1 rounded hover:bg-[#201938] hover:text-zinc-200 transition-colors"
              title="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => insertFormatting('```\n', '\n```')}
              className="p-1 rounded hover:bg-[#201938] hover:text-zinc-200 transition-colors"
              title="Code block"
            >
              <Code size={14} />
            </button>
            <div className="h-3 w-px bg-[#2f274d] mx-1" />
            <button
              onClick={() => setContent((prev) => prev + '@AI ')}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#7b68ee]/20 text-[#c4b5fd] hover:bg-[#7b68ee]/30 hover:text-white text-[11px] font-semibold transition-colors border border-[#7b68ee]/40"
              title="Mention AI Assistant"
            >
              <Sparkles size={11} />
              <span>@AI</span>
            </button>
          </div>

          <div className="text-[10px] text-zinc-500 hidden sm:block">
            Shift + Enter for new line
          </div>
        </div>

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Message #${room.name}... (type @AI to ask assistant)`}
          rows={1}
          className="w-full px-3.5 py-2.5 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none max-h-48"
        />

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#201938] transition-colors"
              title="Attach files"
            >
              {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />}
            </button>

            <button
              type="button"
              onClick={() => setIsEmojiOpen(!isEmojiOpen)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#201938] transition-colors"
              title="Add emoji"
            >
              <Smile size={15} />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={(!content.trim() && attachments.length === 0) || sending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#7b68ee] hover:bg-[#6a56d6] text-white text-xs font-semibold shadow-[0_4px_15px_rgba(123,104,238,0.3)] transition-all disabled:opacity-30 disabled:pointer-events-none transform active:scale-95"
          >
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
