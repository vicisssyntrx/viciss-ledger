'use client';

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabaseClient;
}

// Local mock session storage key for local dev when Supabase env vars are not set
const LOCAL_AUTH_KEY = 'viciss_owner_session';

export async function getCurrentOwner(): Promise<{ email: string; id: string } | null> {
  const supabase = getBrowserSupabase();
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return {
        email: session.user.email || 'owner@viciss.local',
        id: session.user.id,
      };
    }
  }

  // Check local demo session
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCAL_AUTH_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }

  return null;
}

export async function ownerSignOut(): Promise<void> {
  const supabase = getBrowserSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    document.cookie = 'viciss_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function setLocalOwnerSession(email: string): void {
  if (typeof window !== 'undefined') {
    const sessionData = {
      email,
      id: 'local-owner',
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(sessionData));
    document.cookie = `viciss_auth=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }
}
