import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusBarProps {
  status: 'connected' | 'connecting' | 'disconnected';
}

export const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({ status }) => {
  if (status === 'connected') return null;

  return (
    <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-1 flex items-center justify-center gap-2 text-xs font-medium text-amber-300 animate-fadeIn z-30">
      {status === 'connecting' ? (
        <>
          <Loader2 size={13} className="animate-spin" />
          <span>Connecting to real-time server...</span>
        </>
      ) : (
        <>
          <WifiOff size={13} />
          <span>Connection lost. Reconnecting automatically...</span>
        </>
      )}
    </div>
  );
};
