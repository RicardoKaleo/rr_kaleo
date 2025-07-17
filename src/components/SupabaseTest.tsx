'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Session } from '@supabase/supabase-js';

export default function SupabaseTest() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold">Supabase Connection Test</h2>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Supabase Connection Test</h2>
      <pre className="mt-2 p-4 bg-gray-800 rounded-md overflow-auto">
        {JSON.stringify({ session }, null, 2)}
      </pre>
    </div>
  );
} 