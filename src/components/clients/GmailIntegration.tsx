'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// Create Supabase client once
const supabase = createBrowserSupabaseClient();

interface GmailIntegrationProps {
  clientId: string;
  clientName: string;
}

interface GmailStatus {
  active: boolean;
  email?: string;
  last_used?: string;
  token_expires_at?: string;
  error?: string;
}

export default function GmailIntegration({ clientId, clientName }: GmailIntegrationProps) {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadStatus();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      loadStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [clientId]);

  // Check for OAuth error or success in URL when component mounts
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const oauthError = searchParams.get('oauth_error');
    const oauthSuccess = searchParams.get('oauth_success');
    
    console.log('Checking OAuth status:', { oauthError, oauthSuccess });
    
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (oauthSuccess) {
      console.log('OAuth success detected, reloading status...');
      loadStatus();
      setShowSuccess(true);
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading Gmail status for client:', clientId);
      const { data, error } = await supabase
        .from('gmail_integrations')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();
      
      console.log('Gmail integration query result:', { data, error });
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      const statusData = data ? { 
        active: true, 
        email: data.email_address,
        last_used: data.created_at,
        token_expires_at: data.token_expires_at
      } : { active: false };
      
      console.log('Setting Gmail status:', statusData);
      setStatus(statusData);
    } catch (err) {
      console.error('Failed to load Gmail status:', err);
      setError('Failed to load Gmail integration status');
      setStatus({ active: false }); // Set default status even on error
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      // Redirect directly to Gmail OAuth with client ID in the URL
      window.location.href = `/api/auth/gmail/connect?clientId=${encodeURIComponent(clientId)}&returnUrl=${encodeURIComponent(window.location.pathname)}`;
    } catch (err) {
      console.error('Failed to initiate Gmail connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect Gmail account');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      // Get the Gmail integration ID first
      const { data: integration } = await supabase
        .from('gmail_integrations')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();
      
      if (!integration) {
        throw new Error('No active Gmail integration found');
      }
      
      // Call the proper disconnect API
      const response = await fetch('/api/gmail/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gmailIntegrationId: integration.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect');
      }
      
      await loadStatus();
    } catch (err) {
      console.error('Failed to disconnect Gmail:', err);
      setError('Failed to disconnect Gmail account');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <span className="font-medium">Gmail Integration</span>
        </div>
        {status && (
          <div className="flex items-center gap-2">
            {status.active ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Not Connected</span>
              </div>
            )}
          </div>
        )}
      </div>

      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Success!</strong> Gmail account has been successfully connected for {clientName}.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {status?.active ? (
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Gmail is connected for {clientName}</strong>
              {status.email && (
                <div className="mt-1">
                  <strong>Email:</strong> {status.email}
                </div>
              )}
              {status.last_used && (
                <div className="mt-1">
                  <strong>Connected:</strong> {new Date(status.last_used).toLocaleDateString()}
                </div>
              )}
              {status.token_expires_at && (
                <div className="mt-1">
                  <strong>Token expires:</strong> {new Date(status.token_expires_at).toLocaleDateString()}
                </div>
              )}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={connecting}
              className="flex-1"
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Disconnect Gmail
            </Button>
            <Button
              variant="outline"
              onClick={loadStatus}
              disabled={loading}
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No Gmail account is connected for {clientName}. Connect one to send emails on their behalf.
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full"
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Connect Gmail Account
          </Button>
        </div>
      )}
    </div>
  );
} 