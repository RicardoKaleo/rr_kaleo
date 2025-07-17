// Re-export the client implementation only
export { createBrowserSupabaseClient } from './supabase/client'
// Do NOT export createServerSupabaseClient here!

// Simple timeout wrapper for operations
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs = 5000
): Promise<T> => {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}; 