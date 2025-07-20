'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Search, RefreshCw } from 'lucide-react';

export default function TestFallbackPage() {
  const [gmailIntegrationId, setGmailIntegrationId] = useState('');
  const [campaignId, setCampaignId] = useState('a488c378-3aaa-4eb4-941e-8310bbf5a196');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runFallbackDetection = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/gmail/check-replies-fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gmailIntegrationId,
          campaignId: campaignId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to run fallback detection');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Error running fallback detection');
      console.error('Fallback error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Fallback Reply Detection</h1>
        <p className="text-muted-foreground">
          Test the comprehensive fallback system for detecting replies using multiple methods
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fallback Detection Parameters</CardTitle>
          <CardDescription>
            This system uses 3 different methods to detect replies:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gmailIntegrationId">Gmail Integration ID *</Label>
              <Input
                id="gmailIntegrationId"
                value={gmailIntegrationId}
                onChange={(e) => setGmailIntegrationId(e.target.value)}
                placeholder="Enter Gmail integration ID"
              />
            </div>
            <div>
              <Label htmlFor="campaignId">Campaign ID (Optional)</Label>
              <Input
                id="campaignId"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="Leave empty to check all campaigns"
              />
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Detection Methods:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li><strong>1. Thread ID Check:</strong> Checks campaigns with stored thread_id for new messages</li>
              <li><strong>2. Recent Messages:</strong> Scans last 24 hours of Gmail for replies to any campaign</li>
              <li><strong>3. Subject Matching:</strong> Searches for replies by company name in subject line</li>
            </ol>
          </div>

          <Button 
            onClick={runFallbackDetection} 
            disabled={loading || !gmailIntegrationId}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running Detection...' : 'Run Fallback Detection'}
          </Button>
        </CardContent>
      </Card>

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

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Fallback Detection Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Integration Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Email: <Badge variant="outline">{result.results.integration.email}</Badge></div>
                    <div>Active: <Badge variant={result.results.integration.isActive ? "default" : "secondary"}>{result.results.integration.isActive ? "Yes" : "No"}</Badge></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Summary</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>Campaigns Checked: <Badge variant="outline">{result.summary.totalCampaignsChecked}</Badge></div>
                    <div>Replies Found: <Badge variant="default">{result.summary.totalRepliesFound}</Badge></div>
                    <div>Errors: <Badge variant="destructive">{result.summary.totalErrors}</Badge></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Detection Details</h3>
                  <div className="space-y-2">
                    {result.results.details.map((detail: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {detail.method === 'thread_id' && 'Thread ID Check'}
                            {detail.method === 'recent_messages' && 'Recent Messages'}
                            {detail.method === 'subject_matching' && 'Subject Matching'}
                          </span>
                          <Badge variant={detail.replyFound ? "default" : "secondary"}>
                            {detail.replyFound ? "Reply Found" : "No Reply"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {detail.campaignId && <div>Campaign: {detail.campaignId}</div>}
                          <div>Reason: {detail.reason}</div>
                          {detail.replyContent && <div>Content: {detail.replyContent}</div>}
                          {detail.subject && <div>Subject: {detail.subject}</div>}
                          {detail.company && <div>Company: {detail.company}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 