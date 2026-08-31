import React from 'react';
import { Typer } from '../../types/index.ts';
import { Sparkles } from 'lucide-react';

interface TypingIndicatorProps {
  typers: Typer[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typers }) => {
  if (!typers || typers.length === 0) {
    return <div className="h-5" />;
  }

  const aiTyper = typers.find((t) => t.username.toLowerCase() === 'ai' || t.displayName.includes('AI'));
  const humanTypers = typers.filter((t) => t !== aiTyper);

  let text = '';
  if (humanTypers.length === 1) {
    text = `${humanTypers[0].displayName || humanTypers[0].username} is typing...`;
  } else if (humanTypers.length === 2) {
    text = `${humanTypers[0].displayName} and ${humanTypers[1].displayName} are typing...`;
  } else if (humanTypers.length > 2) {
    text = `${humanTypers[0].displayName} and ${humanTypers.length - 1} others are typing...`;
  }

  return (
    <div className="h-5 px-4 flex items-center gap-2 text-xs text-zinc-400 select-none animate-fadeIn">
      {aiTyper ? (
        <div className="flex items-center gap-1.5 text-sky-400 font-medium">
          <Sparkles size={12} className="animate-spin text-sky-400" />
          <span>AI is formulating a response...</span>
        </div>
      ) : null}

      {text ? (
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></span>
          </div>
          <span>{text}</span>
        </div>
      ) : null}
    </div>
  );
};
