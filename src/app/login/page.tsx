'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { getBrowserSupabase, setLocalOwnerSession, getCurrentOwner } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    setIsCloudConfigured(Boolean(supabase));

    // If already logged in, redirect to dashboard
    getCurrentOwner().then((owner) => {
      if (owner) {
        router.push(redirectUrl);
      }
    });
  }, [router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getBrowserSupabase();

      if (supabase) {
        if (mode === 'signin') {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
          });

          if (error) throw error;

          if (data.session) {
            setLocalOwnerSession(email.trim());
            router.push(redirectUrl);
            router.refresh();
          }
        } else {
          // Sign up owner
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
          });

          if (error) throw error;

          if (data.session) {
            setLocalOwnerSession(email.trim());
            router.push(redirectUrl);
            router.refresh();
          } else {
            setSuccessMessage(
              'Account created! If email confirmation is enabled on Supabase, please check your inbox.'
            );
          }
        }
      } else {
        // Local mode session
        setLocalOwnerSession(email.trim());
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAccess = () => {
    setLocalOwnerSession('owner@viciss-ledger.local');
    router.push(redirectUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient gold/emerald glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-block mx-auto mb-2">
            <BrandLogo size="lg" showTagline={false} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Owner Dashboard Access
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to manage your people, transactions, and public ledgers.
          </p>
        </div>

        {/* Card Form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl space-y-5">
          {/* Tabs: Sign In / Create Account */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Owner Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 text-xs rounded-xl bg-rose-950/40 text-rose-300 border border-rose-900/60">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 p-3 text-xs rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-900/60">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950/60 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950/60 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Dashboard' : 'Create Owner Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Button (in case Supabase Auth is optional or local) */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Owner Access (Demo Mode)</span>
            </button>
          </div>
        </div>

        {/* Security & Public Sharing Information */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Encrypted Financial Storage</span>
          </p>
          <p className="text-[11px]">
            Public viewers with shared links do not need to log in and cannot access this dashboard.
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
