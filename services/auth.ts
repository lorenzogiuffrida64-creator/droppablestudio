import { supabase } from './supabase';
import { fetchUserProfile, createUserProfile, updateUserProfile } from './api';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { UserProfile } from '../types/supabase';

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: User; session: Session }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user || !data.session) {
    throw new Error('Login failed - no user or session returned');
  }

  // Update online status
  try {
    await updateUserProfile(data.user.id, {
      online: true,
      last_active: new Date().toISOString(),
    });
  } catch {
    // Profile might not exist yet, that's ok
  }

  return { user: data.user, session: data.session };
}

export async function signOut(): Promise<void> {
  // Update offline status before signing out
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      await updateUserProfile(user.id, {
        online: false,
        last_active: new Date().toISOString(),
      });
    } catch {
      // Ignore errors
    }
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  let profile = await fetchUserProfile(user.id);

  // Create profile if it doesn't exist
  if (!profile && user.email) {
    const name = user.email.split('@')[0];
    profile = await createUserProfile(user.id, name);
  }

  return {
    id: user.id,
    email: user.email || '',
    profile,
  };
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { unsubscribe: () => void } {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return { unsubscribe: () => subscription.unsubscribe() };
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}
