import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { Lock, Mail, Sparkles, Eye, EyeOff, AlertCircle, UserCheck } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, startGoogleOAuth, startGitHubOAuth } = useAuth();
  const [isActive, setIsActive] = useState(false); // false = Login, true = Register

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state (Only Email & Password)
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check URL parameters for OAuth errors or callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      setError(decodeURIComponent(authError));
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({
        identifier: loginEmail.trim(),
        password: loginPassword,
      });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: regEmail.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoUser: string) => {
    setError(null);
    setLoading(true);
    try {
      await login({
        identifier: `${demoUser.toLowerCase()}@example.com`,
        password: 'password123',
      });
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#161226] via-[#100c1e] to-[#0a0714]">
      {/* Background ambient glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#7b68ee]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#9b89f5]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Swapping Container */}
      <div
        className={`relative w-full max-w-[880px] min-h-[580px] bg-[#140f26]/95 border border-[#2f274d] rounded-[24px] shadow-[0_15px_60px_rgba(0,0,0,0.65)] overflow-hidden transition-all duration-700 ${
          isActive ? 'active' : ''
        }`}
      >
        {/* ================= LOGIN FORM BOX ================= */}
        <div
          className={`absolute top-0 w-full md:w-1/2 h-full flex flex-col justify-center px-6 sm:px-12 py-8 z-[2] transition-all duration-700 ease-in-out ${
            isActive
              ? 'md:-left-1/2 opacity-0 pointer-events-none hidden md:flex'
              : 'left-0 opacity-100 pointer-events-auto'
          }`}
        >
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6a56d6] to-[#9b89f5] text-white font-bold text-lg shadow-lg mb-1.5">
                C
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Welcome back</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Sign in to your collaborative workspace</p>
            </div>

            {error && !isActive && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Real OAuth Buttons */}
            <div className="space-y-2">
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={startGoogleOAuth}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#1f1936] hover:bg-[#2a224a] border border-[#3b325c] rounded-xl text-xs font-semibold text-zinc-200 transition-all shadow-sm group hover:border-[#7b68ee]/60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>

              {/* GitHub OAuth Button */}
              <button
                type="button"
                onClick={startGitHubOAuth}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#1f1936] hover:bg-[#2a224a] border border-[#3b325c] rounded-xl text-xs font-semibold text-zinc-200 transition-all shadow-sm group hover:border-[#7b68ee]/60"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="w-full border-t border-[#2d254b]" />
              <span className="absolute px-3 bg-[#140f26] text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                ──────── or ────────
              </span>
            </div>

            {/* Input: Email */}
            <div className="relative">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full px-4 py-2.5 pl-4 pr-11 bg-[#0c0917] border-2 border-[#2b2347] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
              />
              <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>

            {/* Input: Password */}
            <div className="relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 pl-4 pr-11 bg-[#0c0917] border-2 border-[#2b2347] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showLoginPassword ? <EyeOff size={18} /> : <Lock size={18} />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#7b68ee] hover:bg-[#6a56d6] text-white font-semibold text-sm rounded-xl shadow-[0_6px_20px_rgba(123,104,238,0.35)] hover:shadow-[0_8px_25px_rgba(123,104,238,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 mt-1"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* 1-Click Quick Demo Accounts */}
            <div className="pt-2 border-t border-[#261f3e]">
              <p className="text-[11px] text-zinc-400 text-center mb-1 font-medium">
                1-Click Multi-User Demo:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Shaber', role: 'Lead Eng' },
                  { name: 'Arun', role: 'Product UI' },
                  { name: 'Karthi', role: 'Backend' },
                ].map((demo) => (
                  <button
                    key={demo.name}
                    type="button"
                    onClick={() => handleQuickDemoLogin(demo.name)}
                    className="p-1 rounded-xl bg-[#0c0917] hover:bg-[#201938] border border-[#2b2347] text-center transition-colors group"
                  >
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-[#9b89f5]">
                      {demo.name}
                    </div>
                    <div className="text-[10px] text-zinc-500">{demo.role}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Switch */}
            <div className="text-center pt-1 md:hidden">
              <p className="text-xs text-zinc-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsActive(true)}
                  className="text-[#9b89f5] font-semibold hover:underline"
                >
                  Create account
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* ================= REGISTRATION FORM BOX (ONLY EMAIL & PASSWORD) ================= */}
        <div
          className={`absolute top-0 w-full md:w-1/2 h-full flex flex-col justify-center px-6 sm:px-12 py-8 z-[2] transition-all duration-700 ease-in-out ${
            isActive
              ? 'md:left-1/2 opacity-100 pointer-events-auto'
              : 'left-full opacity-0 pointer-events-none hidden md:flex'
          }`}
        >
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6a56d6] to-[#9b89f5] text-white font-bold text-lg shadow-lg mb-1">
                C
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                Create account
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">Enter your email and password to get started</p>
            </div>

            {error && isActive && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* OAuth Quick Sign Up */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={startGoogleOAuth}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-[#1f1936] hover:bg-[#2a224a] border border-[#3b325c] rounded-xl text-xs font-semibold text-zinc-200 transition-all shadow-sm"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={startGitHubOAuth}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-[#1f1936] hover:bg-[#2a224a] border border-[#3b325c] rounded-xl text-xs font-semibold text-zinc-200 transition-all shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-1">
              <div className="w-full border-t border-[#2d254b]" />
              <span className="absolute px-3 bg-[#140f26] text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                ──────── or email ────────
              </span>
            </div>

            {/* Input: Email */}
            <div className="relative">
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full px-4 py-2.5 pl-4 pr-11 bg-[#0c0917] border-2 border-[#2b2347] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
              />
              <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>

            {/* Input: Password */}
            <div className="relative">
              <input
                type={showRegPassword ? 'text' : 'password'}
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                className="w-full px-4 py-2.5 pl-4 pr-11 bg-[#0c0917] border-2 border-[#2b2347] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowRegPassword(!showRegPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showRegPassword ? <EyeOff size={18} /> : <Lock size={18} />}
              </button>
            </div>

            {/* Input: Confirm Password */}
            <div className="relative">
              <input
                type={showRegPassword ? 'text' : 'password'}
                required
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full px-4 py-2.5 pl-4 pr-11 bg-[#0c0917] border-2 border-[#2b2347] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
              />
              <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#7b68ee] hover:bg-[#6a56d6] text-white font-semibold text-sm rounded-xl shadow-[0_6px_20px_rgba(123,104,238,0.35)] hover:shadow-[0_8px_25px_rgba(123,104,238,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 mt-1"
            >
              {loading ? 'Creating Account...' : 'Create account'}
            </button>

            {/* Mobile Switch */}
            <div className="text-center pt-1 md:hidden">
              <p className="text-xs text-zinc-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsActive(false)}
                  className="text-[#9b89f5] font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* ================= TOGGLE OVERLAY PANEL (DESKTOP SLIDER) ================= */}
        <div
          className={`hidden md:block absolute top-0 w-1/2 h-full z-[10] overflow-hidden transition-all duration-700 ease-in-out bg-gradient-to-br from-[#9b89f5] via-[#7b68ee] to-[#6a56d6] shadow-2xl ${
            isActive
              ? 'right-1/2 rounded-r-[160px] rounded-l-none'
              : 'right-0 rounded-l-[160px] rounded-r-none'
          }`}
        >
          {/* Left Toggle Panel (Shown when on Login view) */}
          <div
            className={`absolute w-full h-full flex flex-col justify-center items-center text-white px-10 text-center transition-all duration-700 ease-in-out ${
              isActive
                ? '-left-full opacity-0 pointer-events-none'
                : 'left-0 opacity-100 pointer-events-auto'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner">
              <Sparkles size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Hello, Welcome!</h1>
            <p className="text-sm opacity-90 mb-6 max-w-[240px] leading-relaxed">
              Don't have an account yet? Sign up with just your email and password.
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsActive(true);
              }}
              className="w-40 h-11 bg-transparent border-2 border-white rounded-xl text-sm font-semibold text-white tracking-wide hover:bg-white/15 transform hover:-translate-y-0.5 transition-all shadow-md"
            >
              Sign up
            </button>
          </div>

          {/* Right Toggle Panel (Shown when on Register view) */}
          <div
            className={`absolute w-full h-full flex flex-col justify-center items-center text-white px-10 text-center transition-all duration-700 ease-in-out ${
              isActive
                ? 'left-0 opacity-100 pointer-events-auto'
                : 'left-full opacity-0 pointer-events-none'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner">
              <UserCheck size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-sm opacity-90 mb-6 max-w-[240px] leading-relaxed">
              Already registered? Sign in with your email and password to jump straight in.
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsActive(false);
              }}
              className="w-40 h-11 bg-transparent border-2 border-white rounded-xl text-sm font-semibold text-white tracking-wide hover:bg-white/15 transform hover:-translate-y-0.5 transition-all shadow-md"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
