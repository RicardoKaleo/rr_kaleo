'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const supabase = createBrowserSupabaseClient();

export default function GmailWatchTest() {
  const [watches, setWatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWatches();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadWatches, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadWatches = async () => {
    try {
      // Get active watch subscriptions
      const { data: watchSubs, error: watchError } = await supabase
        .from('gmail_watch_subscriptions')
        .select(`
          *,
          gmail_integrations (
            email_address,
            is_active
          )
        `)
        .eq('is_active', true);

      if (watchError) throw watchError;

      // Get recent history tracking entries
      const { data: history, error: historyError } = await supabase
        .from('gmail_history_tracking')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(5);

      if (historyError) throw historyError;

      setWatches(watchSubs?.map(watch => ({
        ...watch,
        recentHistory: history?.filter(h => h.gmail_integration_id === watch.gmail_integration_id) || []
      })));
    } catch (err) {
      console.error('Failed to load watch status:', err);
      setError('Failed to load Gmail watch status');
    } finally {
      setLoading(false);
    }
  };

  // Test the webhook endpoint
  const testWebhook = async () => {
    try {
      const response = await fetch('/api/gmail/webhooks');
      const data = await response.json();
      console.log('Webhook test response:', data);
    } catch (err) {
      console.error('Failed to test webhook:', err);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Watch Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {watches.length === 0 ? (
          <Alert>
            <AlertDescription>
              No active Gmail watches found. Connect a Gmail account to start receiving notifications.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {watches.map((watch) => (
              <div key={watch.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{watch.gmail_integrations?.email_address}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires: {new Date(watch.expiration_time).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {watch.gmail_integrations?.is_active ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-500">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Inactive</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent History */}
                {watch.recentHistory?.length > 0 && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm font-medium mb-2">Recent Updates:</p>
                    <div className="space-y-1">
                      {watch.recentHistory.map((history: any) => (
                        <p key={history.id} className="text-sm text-muted-foreground">
                          History ID: {history.history_id}
                          <span className="ml-2 text-xs">
                            {new Date(history.processed_at).toLocaleString()}
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button onClick={testWebhook} variant="outline" size="sm">
            Test Webhook
          </Button>
          <Button onClick={loadWatches} variant="outline" size="sm">
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 