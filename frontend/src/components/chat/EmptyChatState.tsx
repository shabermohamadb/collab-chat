import React from 'react';
import { MessageSquare, Sparkles, Users } from 'lucide-react';

interface EmptyChatStateProps {
  roomName: string;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ roomName }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-teal-400 mb-4 shadow-inner">
        <Users size={24} />
      </div>
      <h3 className="text-base font-semibold text-zinc-100">Welcome to #{roomName}!</h3>
      <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
        This is the start of the #{roomName} channel. Discuss ideas, collaborate with your team, or type <span className="text-sky-400 font-mono font-medium">@AI</span> to ask the assistant for structure, code, or feedback.
      </p>
    </div>
  );
};
