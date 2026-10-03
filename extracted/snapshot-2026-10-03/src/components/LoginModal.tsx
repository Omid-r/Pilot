import React, { useState } from 'react';
import { Shield, Lock, User, Key, AlertTriangle, CheckCircle2, Clock, Cpu, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { UserAccount, AuthSession } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (session: AuthSession) => void;
  onClose?: () => void;
  lang: 'fa' | 'en';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose,
  lang
}) => {
  const isFa = lang === 'fa';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedRemaining, setLockedRemaining] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.remainingSec) {
          setLockedRemaining(data.remainingSec);
        }
        throw new Error(data.error || 'ورود ناموفق بود.');
      }

      onLoginSuccess({
        token: data.token,
        user: data.user,
        expiresAt: data.expiresAt
      });
    } catch (err: any) {
      setError(err.message || 'خطا در احراز هویت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0d121c] border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
        dir={isFa ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-800/40 to-cyan-500/10 border-b border-slate-800 p-6 text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/10">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isFa ? 'احراز هویت و ورود به سامانه' : 'Splunk Doctor Access Control'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? 'سامانه پایش پیشرفته و رفع عیب کلاستر اسپلانک (ورود امن)' 
              : 'Enterprise Hardened RBAC Authentication Engine'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {error}
                {lockedRemaining && (
                  <div className="mt-1 font-mono text-[11px] text-rose-200">
                    {isFa ? `مدت زمان مسدودی: ${lockedRemaining} ثانیه` : `Lockout remaining: ${lockedRemaining}s`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              {isFa ? 'نام کاربری' : 'Username'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition pl-10"
                placeholder={isFa ? 'نام کاربری حساب معتبر...' : 'Enter your username...'}
              />
              <User className={`w-4 h-4 text-slate-500 absolute top-3 ${isFa ? 'left-3' : 'right-3'}`} />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              {isFa ? 'کلمه عبور' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition pl-10"
                placeholder={isFa ? 'کلمه عبور...' : 'Enter your password...'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`w-4 h-4 text-slate-500 hover:text-slate-300 absolute top-3 transition ${isFa ? 'left-3' : 'right-3'}`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                {isFa ? 'در حال راستی‌آزمایی امنیتی...' : 'Verifying Security Token...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {isFa ? 'ورود به پنل مدیریت و کلاستر' : 'Authenticate & Enter'}
              </span>
            )}
          </button>
        </form>

        {/* Security Badge Footer */}
        <div className="bg-slate-950/60 border-t border-slate-800/80 px-6 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-500" />
            <span>Node-Locked SHA256 Defense</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PBKDF2 100k Iterations</span>
          </div>
        </div>
      </div>
    </div>
  );
};
