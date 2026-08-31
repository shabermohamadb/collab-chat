import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { Lock, Mail, Sparkles, Eye, EyeOff, AlertCircle, UserCheck } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isActive, setIsActive] = useState(false); // false = Login, true = Register

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state (Email & Password only)
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        className={`relative w-full max-w-[880px] min-h-[540px] bg-[#140f26]/95 border border-[#2f274d] rounded-[24px] shadow-[0_15px_60px_rgba(0,0,0,0.65)] overflow-hidden transition-all duration-700 ${
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
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-[#6a56d6] to-[#9b89f5] text-white font-bold text-xl shadow-lg mb-2">
                C
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Welcome back</h1>
              <p className="text-xs text-zinc-400 mt-1">Sign in with your email and password</p>
            </div>

            {error && !isActive && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Input: Email */}
            <div className="relative">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full px-4 py-3 pl-4 pr-11 bg-[#0c0917] border-2 border-[#2b2347] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
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
                className="w-full px-4 py-3 pl-4 pr-11 bg-[#0c0917] border-2 border-[#2b2347] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
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
              className="w-full h-12 bg-[#7b68ee] hover:bg-[#6a56d6] text-white font-semibold text-sm rounded-xl shadow-[0_6px_20px_rgba(123,104,238,0.35)] hover:shadow-[0_8px_25px_rgba(123,104,238,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* 1-Click Quick Demo Accounts */}
            <div className="pt-3 border-t border-[#261f3e]">
              <p className="text-[11px] text-zinc-400 text-center mb-2 font-medium">
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
                    className="p-1.5 rounded-xl bg-[#0c0917] hover:bg-[#201938] border border-[#2b2347] text-center transition-colors group"
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
            <div className="text-center pt-2 md:hidden">
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

        {/* ================= REGISTRATION FORM BOX (EMAIL & PASSWORD ONLY) ================= */}
        <div
          className={`absolute top-0 w-full md:w-1/2 h-full flex flex-col justify-center px-6 sm:px-12 py-8 z-[2] transition-all duration-700 ease-in-out ${
            isActive
              ? 'md:left-1/2 opacity-100 pointer-events-auto'
              : 'left-full opacity-0 pointer-events-none hidden md:flex'
          }`}
        >
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-[#6a56d6] to-[#9b89f5] text-white font-bold text-xl shadow-lg mb-2">
                C
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                Create account
              </h1>
              <p className="text-xs text-zinc-400 mt-1">Enter your email and password to register</p>
            </div>

            {error && isActive && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Input: Email */}
            <div className="relative">
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full px-4 py-3 pl-4 pr-11 bg-[#0c0917] border-2 border-[#2b2347] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
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
                className="w-full px-4 py-3 pl-4 pr-11 bg-[#0c0917] border-2 border-[#2b2347] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
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
                className="w-full px-4 py-3 pl-4 pr-11 bg-[#0c0917] border-2 border-[#2b2347] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7b68ee] transition-colors"
              />
              <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#7b68ee] hover:bg-[#6a56d6] text-white font-semibold text-sm rounded-xl shadow-[0_6px_20px_rgba(123,104,238,0.35)] hover:shadow-[0_8px_25px_rgba(123,104,238,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create account'}
            </button>

            {/* Mobile Switch */}
            <div className="text-center pt-2 md:hidden">
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
