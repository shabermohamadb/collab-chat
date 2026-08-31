import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { ChatWorkspacePage } from './pages/ChatWorkspacePage.tsx';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();

  // 1. Show loading state until /api/auth/me has answered
  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0c0a14] flex flex-col items-center justify-center gap-3 select-none">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6a56d6] to-[#9b89f5] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#7b68ee]/30 animate-pulse">
          C
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Loader2 size={14} className="animate-spin text-[#9b89f5]" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  // 2. If authenticated user exists, render dashboard / chat workspace
  if (user) {
    return <ChatWorkspacePage />;
  }

  // 3. Otherwise, render login & registration page
  return <AuthPage />;
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
