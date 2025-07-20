'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForTokens, saveGmailIntegration } from '@/lib/gmail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function GmailOAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const clientId = sessionStorage.getItem('gmail_integration_client_id');
        if (!clientId) {
          setError('No client ID found. Please try connecting Gmail again.');
          setStatus('error');
          return;
        }

        if (error) {
          setError(`OAuth error: ${error}`);
          setStatus('error');
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setStatus('error');
          return;
        }

        if (!clientId) {
          setError('No client ID found. Please try connecting Gmail again.');
          setStatus('error');
          return;
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);

        // Save the Gmail integration for this specific client
        await saveGmailIntegration(clientId!, tokens, tokens.email_address);

        // Clear the stored client ID
        sessionStorage.removeItem('gmail_integration_client_id');

        setStatus('success');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setStatus('error');
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  const handleRetry = () => {
    const clientId = sessionStorage.getItem('gmail_integration_client_id');
    sessionStorage.removeItem('gmail_integration_client_id');
    if (clientId) {
      router.push(`/dashboard/clients/${clientId}`);
    } else {
      router.push('/dashboard/clients');
    }
  };

  const handleContinue = () => {
    const clientId = sessionStorage.getItem('gmail_integration_client_id');
    sessionStorage.removeItem('gmail_integration_client_id');
    if (clientId) {
      router.push(`/dashboard/clients/${clientId}`);
    } else {
      router.push('/dashboard/clients');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            Gmail Integration
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Setting up Gmail integration...'}
            {status === 'success' && 'Gmail integration successful!'}
            {status === 'error' && 'Failed to set up Gmail integration'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Please wait while we configure the Gmail account...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  The Gmail account has been successfully connected. You can now send emails and track replies through the platform.
                </AlertDescription>
              </Alert>
              <Button onClick={handleContinue} className="w-full">
                Return to Client
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || 'An error occurred while setting up the Gmail integration.'}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={handleRetry} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={handleContinue} className="flex-1">
                  Return to Client
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 