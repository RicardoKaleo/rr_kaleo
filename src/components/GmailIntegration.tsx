'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { initiateGmailOAuth, getGmailIntegration, isTokenExpired } from '@/lib/gmail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface GmailIntegrationProps {
  clientId?: string; // Optional: if you want to show integration for a specific client
}

export default function GmailIntegration({ clientId }: GmailIntegrationProps) {
  const { user } = useAuth();
  const [integration, setIntegration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    loadIntegration();
  }, [clientId, user]);

  const loadIntegration = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      // Use clientId if provided, otherwise use user ID
      const targetId = clientId || user.id;
      const gmailIntegration = await getGmailIntegration(targetId);
      setIntegration(gmailIntegration);
      
      // Check if token is expired and attempt to refresh
      if (gmailIntegration && isTokenExpired(gmailIntegration.token_expires_at)) {
        await attemptTokenRefresh(gmailIntegration);
      }
    } catch (err) {
      console.error('Failed to load Gmail integration:', err);
      setError('Failed to load Gmail integration');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = () => {
    initiateGmailOAuth();
  };

  const attemptTokenRefresh = async (integrationData: any) => {
    try {
      setRefreshing(true);
      setError('');

      const response = await fetch('/api/gmail/refresh-token', {
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
        const { createBrowserSupabaseClient } = await import('@/lib/supabase/client');
        const supabase = createBrowserSupabaseClient();
        
        const { error: updateError } = await supabase
          .from('gmail_integrations')
          .update({ is_active: false })
          .eq('id', integrationData.id);

        if (updateError) {
          console.error('Failed to deactivate integration:', updateError);
        }

        setIntegration(null);
        setError('Token refresh failed. Please reconnect your Gmail account.');
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
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error in attemptTokenRefresh:', err);
      setError('Failed to refresh token');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshIntegration = () => {
    loadIntegration();
  };

  const getStatusBadge = () => {
    if (!integration) return null;

    if (refreshing) {
      return <Badge variant="secondary">Refreshing...</Badge>;
    }

    if (!integration.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (isTokenExpired(integration.token_expires_at)) {
      return <Badge variant="destructive">Token Expired</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  const getStatusIcon = () => {
    if (!integration) return <XCircle className="h-5 w-5 text-red-500" />;

    if (refreshing) {
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    }

    if (!integration.is_active) {
      return <XCircle className="h-5 w-5 text-gray-500" />;
    }

    if (isTokenExpired(integration.token_expires_at)) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }

    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Integration
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Connect your Gmail account to send emails and track replies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!integration ? (
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                No Gmail account connected. Connect your Gmail account to start sending emails and tracking replies.
              </AlertDescription>
            </Alert>
            <Button onClick={handleConnectGmail} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Connect Gmail Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div className="flex-1">
                <p className="font-medium">{integration.email_address}</p>
                <p className="text-sm text-muted-foreground">
                  Connected on {new Date(integration.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">
                  {integration.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Token Expires</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(integration.token_expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleConnectGmail} 
                variant="outline" 
                className="flex-1"
                disabled={refreshing}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Reconnect
              </Button>
              <Button 
                onClick={handleRefreshIntegration} 
                variant="outline" 
                size="icon"
                disabled={refreshing}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {refreshing && (
                <Button 
                  disabled
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing Token...
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 