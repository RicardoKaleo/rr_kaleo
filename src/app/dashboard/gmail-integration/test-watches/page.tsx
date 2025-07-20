'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface GmailIntegration {
  id: string;
  email_address: string;
  is_active: boolean;
  created_at: string;
  client?: {
    first_name: string;
    last_name: string;
  };
}

interface GmailWatch {
  id: string;
  gmail_integration_id: string;
  history_id: string;
  expiration_time: string;
  topic_name: string;
  is_active: boolean;
  last_sync_at: string;
}

export default function TestGmailWatches() {
  const [integrations, setIntegrations] = useState<GmailIntegration[]>([]);
  const [watches, setWatches] = useState<GmailWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingUpWatch, setSettingUpWatch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/gmail/watch');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      
      // Transform the data to match our interface
      const transformedIntegrations = (data.integrations || []).map((integration: any) => ({
        id: integration.id,
        email_address: integration.email_address,
        is_active: integration.is_active,
        created_at: integration.created_at,
        client: integration.client ? {
          first_name: integration.client.first_name,
          last_name: integration.client.last_name,
        } : undefined,
      }));
      
      setIntegrations(transformedIntegrations);
      setWatches(data.watches || []);
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const setupWatchForIntegration = async (integrationId: string) => {
    try {
      setSettingUpWatch(integrationId);
      setError(null);

      const response = await fetch('/api/gmail/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ integrationId }),
      });

      if (response.ok) {
        // Refresh data
        await fetchData();
      } else {
        setError('Failed to set up Gmail watch');
      }
    } catch (err) {
      console.error('Error setting up watch:', err);
      setError('Error setting up Gmail watch');
    } finally {
      setSettingUpWatch(null);
    }
  };

  const refreshAllWatches = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/gmail/watch', {
        method: 'PUT',
      });

      if (response.ok) {
        await fetchData();
      } else {
        setError('Error refreshing Gmail watches');
      }
    } catch (err) {
      console.error('Error refreshing watches:', err);
      setError('Error refreshing Gmail watches');
    }
  };

  const getWatchStatus = (integrationId: string) => {
    const watch = watches.find(w => w.gmail_integration_id === integrationId);
    if (!watch) return 'not_setup';
    
    const expirationTime = new Date(watch.expiration_time);
    const now = new Date();
    
    if (expirationTime <= now) return 'expired';
    if (expirationTime <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) return 'expiring_soon';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    const config = {
      not_setup: { label: 'Not Setup', variant: 'secondary' as const, icon: AlertCircle },
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      expiring_soon: { label: 'Expiring Soon', variant: 'secondary' as const, icon: Clock },
      expired: { label: 'Expired', variant: 'destructive' as const, icon: AlertCircle },
    };

    const configItem = config[status as keyof typeof config] || config.not_setup;
    const Icon = configItem.icon;

    return (
      <Badge variant={configItem.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {configItem.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gmail Watch Test</h1>
          <p className="text-muted-foreground">
            Test and manage Gmail push/pull notifications
          </p>
        </div>
        <Button onClick={refreshAllWatches} className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Refresh All Watches
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>Required for Gmail push notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">GOOGLE_CLOUD_PROJECT_ID:</span>
            <Badge variant="secondary">
              Server-side only (not visible in browser)
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">GOOGLE_PUBSUB_TOPIC:</span>
            <Badge variant="secondary">
              Server-side only (not visible in browser)
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gmail Integrations ({integrations.length})</CardTitle>
          <CardDescription>Active Gmail integrations and their watch status</CardDescription>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No active Gmail integrations found
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => {
                const watchStatus = getWatchStatus(integration.id);
                const watch = watches.find(w => w.gmail_integration_id === integration.id);
                
                return (
                  <div key={integration.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{integration.email_address}</h3>
                        {integration.client && (
                          <p className="text-sm text-muted-foreground">
                            {integration.client.first_name} {integration.client.last_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(watchStatus)}
                        {watchStatus === 'not_setup' && (
                          <Button
                            size="sm"
                            onClick={() => setupWatchForIntegration(integration.id)}
                            disabled={settingUpWatch === integration.id}
                          >
                            {settingUpWatch === integration.id ? 'Setting up...' : 'Setup Watch'}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {watch && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>History ID: {watch.history_id}</div>
                        <div>Topic: {watch.topic_name}</div>
                        <div>Expires: {new Date(watch.expiration_time).toLocaleString()}</div>
                        <div>Last Sync: {new Date(watch.last_sync_at).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Status</CardTitle>
          <CardDescription>Test if the webhook endpoint is accessible</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="font-medium">Webhook URL:</span>
            <code className="bg-muted px-2 py-1 rounded text-sm">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/gmail/webhooks` : '/api/gmail/webhooks'}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 