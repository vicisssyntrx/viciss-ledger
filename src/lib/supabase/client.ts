'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

const LOCAL_AUTH_KEY = 'viciss_owner_session';

export function isOwnerAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const hasCookie = document.cookie.split(';').some((c) => c.trim().startsWith('viciss_auth=1'));
  const hasStorage = Boolean(localStorage.getItem(LOCAL_AUTH_KEY));
  return hasCookie || hasStorage;
}

export async function getCurrentOwner(): Promise<{ email: string; id: string } | null> {
  if (typeof window === 'undefined') return null;

  const supabase = getBrowserSupabase();
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          email: session.user.email || 'owner@viciss.local',
          id: session.user.id,
        };
      }
    } catch {
      // Continue to check local session
    }
  }

  // Check client cookie or storage
  if (isOwnerAuthenticated()) {
    const stored = localStorage.getItem(LOCAL_AUTH_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { email: 'admin', id: 'owner-local' };
      }
    }
    return { email: 'admin', id: 'owner-local' };
  }

  return null;
}

export async function ownerSignOut(): Promise<void> {
  const supabase = getBrowserSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
  }

  // Call server logout to clear HttpOnly cookies
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network errors on logout
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    sessionStorage.clear();
    document.cookie = 'viciss_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'viciss_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
}

export function setLocalOwnerSession(username: string): void {
  if (typeof window !== 'undefined') {
    const sessionData = {
      email: username,
      id: 'owner-local',
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(sessionData));
    document.cookie = `viciss_auth=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }
}
