import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import {
  User,
  Mail,
  Calendar,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface SettingsPageProps {
  onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const { user, startGoogleOAuth, startGitHubOAuth, disconnectProvider, logout } = useAuth();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!user) return null;

  const connectedAccounts = user.connectedAccounts || [];
  const isGoogleConnected = connectedAccounts.includes('google');
  const isGitHubConnected = connectedAccounts.includes('github');

  const handleDisconnect = async (provider: string) => {
    setError(null);
    setSuccessMsg(null);
    setDisconnecting(provider);
    try {
      await disconnectProvider(provider);
      setSuccessMsg(`Successfully disconnected ${provider.toUpperCase()}.`);
    } catch (err: any) {
      setError(err.message || `Failed to disconnect ${provider}.`);
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-[#140f26] border border-[#2f274d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#251f3e] flex items-center justify-between bg-[#19132f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6a56d6] to-[#9b89f5] flex items-center justify-center text-white font-bold text-sm">
              ⚙️
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Account Settings</h2>
              <p className="text-xs text-zinc-400">Manage your profile & connected accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#261f3e] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Profile Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-3">
              Profile
            </h3>
            <div className="p-4 rounded-xl bg-[#0c0917] border border-[#261f3e] flex items-center gap-4">
              <img
                src={user.avatarUrl || user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`}
                alt={user.displayName}
                className="w-14 h-14 rounded-2xl ring-2 ring-[#7b68ee]/40 object-cover bg-zinc-800"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-base font-bold text-zinc-100 truncate">{user.name || user.displayName}</div>
                <div className="text-xs text-[#9b89f5] font-medium">@{user.username}</div>
                <div className="text-xs text-zinc-400 flex items-center gap-1.5 pt-0.5">
                  <Mail size={12} className="text-zinc-500" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Connected Accounts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                Connected Accounts
              </h3>
              <span className="text-[11px] text-zinc-500">OAuth 2.0 Providers</span>
            </div>

            <div className="space-y-3">
              {/* Google */}
              <div className="p-3.5 rounded-xl bg-[#0c0917] border border-[#261f3e] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a1430] border border-[#30274f] flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">Google</div>
                    <div className="text-[11px] text-zinc-400">
                      {isGoogleConnected ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 size={11} /> Connected
                        </span>
                      ) : (
                        'Not connected'
                      )}
                    </div>
                  </div>
                </div>

                {isGoogleConnected ? (
                  <button
                    type="button"
                    disabled={disconnecting === 'google'}
                    onClick={() => handleDisconnect('google')}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {disconnecting === 'google' ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startGoogleOAuth}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#7b68ee] hover:bg-[#6a56d6] rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Connect</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>

              {/* GitHub */}
              <div className="p-3.5 rounded-xl bg-[#0c0917] border border-[#261f3e] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a1430] border border-[#30274f] flex items-center justify-center">
                    <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">GitHub</div>
                    <div className="text-[11px] text-zinc-400">
                      {isGitHubConnected ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 size={11} /> Connected
                        </span>
                      ) : (
                        'Not connected'
                      )}
                    </div>
                  </div>
                </div>

                {isGitHubConnected ? (
                  <button
                    type="button"
                    disabled={disconnecting === 'github'}
                    onClick={() => handleDisconnect('github')}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {disconnecting === 'github' ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startGitHubOAuth}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#7b68ee] hover:bg-[#6a56d6] rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Connect</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Session Management */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-2">
              Authentication Security
            </h3>
            <div className="p-3.5 rounded-xl bg-[#0c0917] border border-[#261f3e] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">Active Session</div>
                <div className="text-[11px] text-zinc-400">
                  Secured with HttpOnly cookie & PostgreSQL session store
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-[#221a3a] hover:bg-red-900/40 hover:text-red-300 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#251f3e] bg-[#100c1e] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#231b3e] hover:bg-[#2f2552] text-xs font-semibold text-zinc-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
