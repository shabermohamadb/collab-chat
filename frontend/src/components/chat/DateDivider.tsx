import React from 'react';
import { formatDateDivider } from '../../utils/date.ts';

interface DateDividerProps {
  date: string | Date;
}

export const DateDivider: React.FC<DateDividerProps> = ({ date }) => {
  return (
    <div className="relative flex items-center justify-center my-4 select-none">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-800/80" />
      </div>
      <div className="relative px-3 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-400 shadow-sm">
        {formatDateDivider(date)}
      </div>
    </div>
  );
};
