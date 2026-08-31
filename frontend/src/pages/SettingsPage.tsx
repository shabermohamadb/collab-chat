import React from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import {
  User,
  Mail,
  Calendar,
  Shield,
  X,
  Lock,
} from 'lucide-react';

interface SettingsPageProps {
  onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

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
              <p className="text-xs text-zinc-400">Manage your profile & session</p>
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

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-xl bg-[#0c0917] border border-[#261f3e]">
                <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                  <Shield size={12} className="text-[#9b89f5]" />
                  <span>Account Type</span>
                </div>
                <div className="text-xs font-semibold text-zinc-200">
                  {user.isAi ? 'AI System Participant' : 'Standard Workspace Member'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0917] border border-[#261f3e]">
                <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                  <Calendar size={12} className="text-[#9b89f5]" />
                  <span>Joined Date</span>
                </div>
                <div className="text-xs font-semibold text-zinc-200">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Session Security */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-2">
              Authentication & Security
            </h3>
            <div className="p-3.5 rounded-xl bg-[#0c0917] border border-[#261f3e] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  <Lock size={12} className="text-emerald-400" />
                  <span>Active Session</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Protected with encrypted session token & JSON database
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
