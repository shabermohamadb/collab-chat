import React from 'react';

interface MainLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ sidebar, children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 antialiased select-none">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-900/30 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
};
