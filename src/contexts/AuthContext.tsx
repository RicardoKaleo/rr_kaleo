'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Database } from '@/lib/database.types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  authStatus: 'unknown' | 'authenticated' | 'unauthenticated';
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>; // <-- Add this line
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'unknown' | 'authenticated' | 'unauthenticated'>('unknown');

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const checkUser = async () => {
      try {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setUser(authUser);
        setAuthStatus(authUser ? 'authenticated' : 'unauthenticated');
      } catch (e) {
        console.error('Error checking user:', e);
        setError(e instanceof Error ? e.message : 'An error occurred');
        setAuthStatus('unauthenticated');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        setUser(session?.user ?? null);
        setAuthStatus(session?.user ? 'authenticated' : 'unauthenticated');
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createBrowserSupabaseClient();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setUser(data.user);
      setAuthStatus('authenticated');
    } catch (e) {
      const authError = e as AuthError;
      setError(authError.message);
      throw e;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    const supabase = createBrowserSupabaseClient();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });
      if (error) throw error;

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              role: role,
            },
          ]);
        if (profileError) throw profileError;
      }

      setUser(data.user);
      setAuthStatus('authenticated');
    } catch (e) {
      const authError = e as AuthError;
      setError(authError.message);
      throw e;
    }
  };

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setAuthStatus('unauthenticated');
    } catch (e) {
      const authError = e as AuthError;
      setError(authError.message);
      throw e;
    }
  };

  // Add refreshUser function
  const refreshUser = async () => {
    const supabase = createBrowserSupabaseClient();
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setUser(authUser);
      setAuthStatus(authUser ? 'authenticated' : 'unauthenticated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
      setAuthStatus('unauthenticated');
    }
  };

  const value = {
    user,
    loading,
    error,
    authStatus,
    signIn,
    signUp,
    signOut,
    refreshUser, // <-- Add this line
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 