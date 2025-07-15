import { supabase } from './supabase'
import { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  role: 'manager' | 'final_user'
  full_name: string
}

// Get current user with profile data
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log('[getCurrentUser] called');
    // Add a timeout to prevent hanging forever
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => {
      console.error('[getCurrentUser] Timeout after 5s');
      resolve(null);
    }, 5000));

    const userPromise = (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('[getCurrentUser] supabase.auth.getUser result:', user, error);
      if (error || !user) {
        return null;
      }
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      console.log('[getCurrentUser] profile result:', profile, profileError);
      if (profileError || !profile) {
        return null;
      }
      return {
        id: user.id,
        email: user.email!,
        role: profile.role,
        full_name: profile.full_name
      };
    })();

    // Race the userPromise and timeoutPromise
    const result = await Promise.race([userPromise, timeoutPromise]);
    console.log('[getCurrentUser] final result:', result);
    return result;
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}

// Sign up with profile creation
export async function signUp(email: string, password: string, fullName: string, role: 'manager' | 'final_user' = 'final_user') {
  try {
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (user) {
      // Insert user profile (app-managed)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          role: role
        })
      // If duplicate, ignore error
      if (profileError && !profileError.message.includes('duplicate key')) throw profileError
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

// Sign in
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    return { error }
  }
}

// Update user profile
export async function updateProfile(userId: string, updates: { full_name?: string; role?: 'manager' | 'final_user' }) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch (error) {
    return false
  }
}

// Get user role
export async function getUserRole(userId: string): Promise<'manager' | 'final_user' | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return data.role
  } catch (error) {
    return null
  }
} 