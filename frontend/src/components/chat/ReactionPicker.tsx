import React, { useRef, useEffect } from 'react';

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🚀', '🎉', '👀', '💡', '✅', '🙌', '💯'];

interface ReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-1.5 flex items-center gap-1 p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-30 animate-fadeIn"
    >
      {COMMON_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelectEmoji(emoji);
            onClose();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-sm hover:scale-125 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
