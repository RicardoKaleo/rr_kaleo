'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function TestPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function testQuery() {
      if (!user) return;
      
      const supabase = createBrowserSupabaseClient();
      
      try {
        setLoading(true);
        setError(null);
        
        // Test 1: Get user profile
        console.log('Testing user profile query...');
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Profile error:', profileError);
          setError(`Profile error: ${profileError.message}`);
          return;
        }
        
        console.log('Profile data:', profile);
        
        // Test 2: Get clients based on role
        console.log('Testing clients query...');
        let query = supabase.from('clients').select('*');
        
        if (profile.role === 'final_user') {
          const { data: finalUserClients, error: clientError } = await supabase
            .from('client_final_users')
            .select('client_id')
            .eq('final_user_id', user.id);
          
          if (clientError) {
            console.error('Client assignment error:', clientError);
            setError(`Client assignment error: ${clientError.message}`);
            return;
          }
          
          console.log('Final user clients:', finalUserClients);
          
          if (finalUserClients && finalUserClients.length > 0) {
            query = query.in('id', finalUserClients.map(c => c.client_id));
          } else {
            setData([]);
            setLoading(false);
            return;
          }
        } else if (profile.role === 'manager') {
          const { data: managerClients, error: clientError } = await supabase
            .from('client_managers')
            .select('client_id')
            .eq('manager_id', user.id);
          
          if (clientError) {
            console.error('Manager assignment error:', clientError);
            setError(`Manager assignment error: ${clientError.message}`);
            return;
          }
          
          console.log('Manager clients:', managerClients);
          
          if (managerClients && managerClients.length > 0) {
            query = query.in('id', managerClients.map(c => c.client_id));
          }
        }
        
        const { data: clients, error: clientsError } = await query;
        
        if (clientsError) {
          console.error('Clients error:', clientsError);
          setError(`Clients error: ${clientsError.message}`);
          return;
        }
        
        console.log('Clients data:', clients);
        setData(clients);
        
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    testQuery();
  }, [user]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <pre className="bg-red-100 p-4 rounded text-red-800">{error}</pre>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Results</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
} 