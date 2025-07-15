'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthUser, getCurrentUser, signIn, signUp, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string, fullName: string, role?: 'manager' | 'final_user') => Promise<{ user: any; error: any }>
  signOut: () => Promise<{ error: any }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function ensureUserProfile(user: { id: string; email: string }) {
  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile) {
    // Only update profile fields that may change, but do NOT overwrite role
    await supabase.from('user_profiles').update({
      full_name: user.email // or use user.user_metadata.full_name if available
    }).eq('id', user.id);
  } else if (!profile && !profileError) {
    // If no profile, insert a new one with default role
    await supabase.from('user_profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.email, // or use user.user_metadata.full_name if available
      role: 'final_user'
    });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    setLoading(true); // Ensure loading is set to true at the start
    console.log('[AuthContext] refreshUser called');
    try {
      const currentUser = await getCurrentUser();
      console.log('[AuthContext] getCurrentUser result:', currentUser);
      setUser(currentUser);
      if (currentUser) {
        await ensureUserProfile(currentUser);
      }
    } catch (error) {
      console.error('[AuthContext] Error refreshing user:', error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('[AuthContext] setLoading(false) called');
    }
  }

  useEffect(() => {
    // Get initial user
    refreshUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 