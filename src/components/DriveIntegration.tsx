'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface DriveIntegration {
  id: string;
  user_id: string;
  email_address: string;
  is_active: boolean;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  folder_id?: string;
  created_at: string;
}

export default function DriveIntegration() {
  const [integration, setIntegration] = useState<DriveIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    fetchIntegration();
  }, []);

  const fetchIntegration = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        return;
      }

      const { data, error } = await supabase
        .from('google_drive_integrations')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching Drive integration:', error);
        setError('Failed to fetch integration status');
      } else {
        setIntegration(data);
        
        // Check if token is expired and attempt to refresh
        if (data && isTokenExpired(data)) {
          await attemptTokenRefresh(data);
        }
      }
    } catch (err) {
      console.error('Error in fetchIntegration:', err);
      setError('Failed to fetch integration status');
    } finally {
      setLoading(false);
    }
  };

  const attemptTokenRefresh = async (integrationData: DriveIntegration) => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch('/api/drive/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: integrationData.refresh_token,
          integration_id: integrationData.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token refresh failed:', errorData);
        
        // If refresh fails, mark integration as inactive
        const { error: updateError } = await supabase
          .from('google_drive_integrations')
          .update({ is_active: false })
          .eq('id', integrationData.id);

        if (updateError) {
          console.error('Failed to deactivate integration:', updateError);
        }

        setIntegration(null);
        setError('Token refresh failed. Please reconnect your Google Drive account.');
        return;
      }

      const result = await response.json();
      
      // Update local state with new token data
      setIntegration({
        ...integrationData,
        access_token: result.access_token,
        token_expires_at: result.expires_at,
      });

      setSuccess('Token refreshed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error in attemptTokenRefresh:', err);
      setError('Failed to refresh token');
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      
      // Redirect to Google Drive OAuth
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/api/auth/drive/connect?returnUrl=${returnUrl}`;
    } catch (err) {
      console.error('Error connecting Drive:', err);
      setError('Failed to initiate Drive connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('google_drive_integrations')
        .update({ is_active: false })
        .eq('id', integration!.id);

      if (error) {
        console.error('Error disconnecting Drive:', error);
        setError('Failed to disconnect Drive integration');
      } else {
        setIntegration(null);
        setSuccess('Drive integration disconnected successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error in handleDisconnect:', err);
      setError('Failed to disconnect Drive integration');
    }
  };

  const isTokenExpired = (integrationData?: DriveIntegration | null) => {
    const data = integrationData || integration;
    if (!data?.token_expires_at) return false;
    return new Date(data.token_expires_at) < new Date();
  };

  const getStatusBadge = () => {
    if (!integration) {
      return <Badge variant="secondary">Not Connected</Badge>;
    }
    
    if (refreshing) {
      return <Badge variant="secondary">Refreshing...</Badge>;
    }
    
    if (isTokenExpired()) {
      return <Badge variant="destructive">Token Expired</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-600">Connected</Badge>;
  };

  const getStatusIcon = () => {
    if (!integration) {
      return <XCircle className="h-5 w-5 text-gray-400" />;
    }
    
    if (refreshing) {
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    }
    
    if (isTokenExpired()) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Google Drive Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading integration status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Google Drive Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Drive to store resume files securely
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Status</p>
            {getStatusBadge()}
          </div>
          
          {integration && (
            <div className="space-y-1 text-right">
              <p className="text-sm font-medium">Connected Email</p>
              <p className="text-sm text-muted-foreground">{integration.email_address}</p>
            </div>
          )}
        </div>

        {integration && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Connection Details</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Connected: {new Date(integration.created_at).toLocaleDateString()}</p>
              {integration.token_expires_at && (
                <p>Token expires: {new Date(integration.token_expires_at).toLocaleString()}</p>
              )}
              {integration.folder_id && (
                <p>Folder ID: {integration.folder_id}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!integration ? (
            <Button 
              onClick={handleConnect} 
              disabled={connecting}
              className="flex items-center gap-2"
            >
              {connecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              {connecting ? 'Connecting...' : 'Connect Google Drive'}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Disconnect
              </Button>
              {refreshing && (
                <Button 
                  disabled
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Refreshing Token...
                </Button>
              )}
            </>
          )}
        </div>

        {!integration && (
          <div className="text-xs text-muted-foreground">
            <p>This will allow the application to:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Create and manage files in your Google Drive</li>
              <li>Store resume files securely in a dedicated folder</li>
              <li>Access files only when sending emails</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 