import React, { useRef, useEffect } from 'react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😜', '🤔', '🤫', '🤗'],
  },
  {
    name: 'Hands & Collaboration',
    emojis: ['👍', '👎', '👏', '🙌', '👐', '🤝', '🙏', '✍️', '💪', '👋', '✌️', '🤞', '🤙', '👊', '👌'],
  },
  {
    name: 'Symbols & Work',
    emojis: ['🚀', '🔥', '🎉', '💡', '✅', '❌', '⚠️', '⭐', '🌟', '💯', '🎯', '📌', '📎', '💻', '⚙️', '📊', '📈', '🛠️'],
  },
];

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
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
      ref={modalRef}
      className="absolute bottom-full right-4 mb-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-3 z-30 animate-fadeIn"
    >
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {EMOJI_CATEGORIES.map((category) => (
          <div key={category.name}>
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              {category.name}
            </div>
            <div className="grid grid-cols-6 gap-1">
              {category.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelectEmoji(emoji);
                    onClose();
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
