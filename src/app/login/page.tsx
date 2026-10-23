'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { getBrowserSupabase, setLocalOwnerSession, isOwnerAuthenticated } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in, redirect to dashboard immediately
    if (isOwnerAuthenticated()) {
      window.location.replace(redirectUrl);
    }
  }, [redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const userClean = username.trim();
    const passClean = password.trim();

    if (!userClean || !passClean) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Call server login API to verify credentials & set HttpOnly cookies
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userClean, password: passClean }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If Supabase is configured and input is email, try Supabase auth fallback
        const supabase = getBrowserSupabase();
        if (supabase && userClean.includes('@')) {
          const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
            email: userClean,
            password: passClean,
          });

          if (!supaErr && supaData.session) {
            setLocalOwnerSession(userClean);
            window.location.replace(redirectUrl);
            return;
          }
        }

        throw new Error(data.error || 'Invalid credentials. Please check your username and password.');
      }

      // 2. Set client auth state
      setLocalOwnerSession(userClean);

      // 3. Navigate into protected dashboard using replace so login is replaced in history
      window.location.replace(redirectUrl);
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background warm bronze/gold glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-block mx-auto mb-2">
            <BrandLogo size="lg" showTagline={false} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-500" />
            <span>Owner Access Lock</span>
          </h1>
          <p className="text-xs text-slate-400">
            Enter your credentials to unlock your personal money ledger.
          </p>
        </div>

        {/* Lock Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl space-y-5">
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 text-xs rounded-xl bg-rose-950/40 text-rose-300 border border-rose-900/60">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950/60 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950/60 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-premium-brown w-full py-3 rounded-xl text-sm mt-2"
            >
              <span>{isLoading ? 'Unlocking...' : 'Unlock Ledger'}</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-slate-500">
            Default credentials: <span className="font-mono text-slate-400">admin</span> / <span className="font-mono text-slate-400">2030</span>
          </div>
        </div>

        {/* Security & Public Sharing Information */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Encrypted Owner Session Lock</span>
          </p>
          <p className="text-[11px]">
            Public viewers with shared links do not need to log in and cannot access this private dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-xs text-slate-400">
          Loading access screen...
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}
