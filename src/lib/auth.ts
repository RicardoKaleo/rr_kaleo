import { User } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from './supabase/client';

export type AuthUser = User;

// Helper function to get the current user's profile
export async function getUserProfile(userId: string) {
  const supabase = createBrowserSupabaseClient();
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return profile;
}

// Helper function to check if a user has a specific role
export async function hasRole(userId: string, role: string) {
  const profile = await getUserProfile(userId);
  return profile?.role === role;
}

// Helper function to check if a user has access to a specific client
export async function hasClientAccess(userId: string, clientId: string) {
  const supabase = createBrowserSupabaseClient();
  
  // Check manager access
  const { data: managerAccess, error: managerError } = await supabase
    .from('client_managers')
    .select('*')
    .eq('manager_id', userId)
    .eq('client_id', clientId)
    .single();

  if (managerError && managerError.code !== 'PGRST116') throw managerError;
  if (managerAccess) return true;

  // Check final user access
  const { data: finalUserAccess, error: finalUserError } = await supabase
    .from('client_final_users')
    .select('*')
    .eq('final_user_id', userId)
    .eq('client_id', clientId)
    .single();

  if (finalUserError && finalUserError.code !== 'PGRST116') throw finalUserError;
  return !!finalUserAccess;
} 