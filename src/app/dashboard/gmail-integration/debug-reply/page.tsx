'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Search } from 'lucide-react';

export default function DebugReplyPage() {
  const [historyId, setHistoryId] = useState('1511505');
  const [campaignId, setCampaignId] = useState('a488c378-3aaa-4eb4-941e-8310bbf5a196');
  const [gmailIntegrationId, setGmailIntegrationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const debugReply = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/gmail/debug-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          historyId,
          campaignId,
          gmailIntegrationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to debug reply');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Error debugging reply');
      console.error('Debug error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Debug Reply Detection</h1>
        <p className="text-muted-foreground">
          Investigate why a specific history ID didn't trigger reply detection
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Parameters</CardTitle>
          <CardDescription>
            Enter the details to investigate the reply detection issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="historyId">History ID</Label>
              <Input
                id="historyId"
                value={historyId}
                onChange={(e) => setHistoryId(e.target.value)}
                placeholder="1511505"
              />
            </div>
            <div>
              <Label htmlFor="campaignId">Campaign ID</Label>
              <Input
                id="campaignId"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="a488c378-3aaa-4eb4-941e-8310bbf5a196"
              />
            </div>
            <div>
              <Label htmlFor="gmailIntegrationId">Gmail Integration ID</Label>
              <Input
                id="gmailIntegrationId"
                value={gmailIntegrationId}
                onChange={(e) => setGmailIntegrationId(e.target.value)}
                placeholder="Enter Gmail integration ID"
              />
            </div>
          </div>
          <Button 
            onClick={debugReply} 
            disabled={loading || !historyId || !campaignId || !gmailIntegrationId}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Debugging...' : 'Debug Reply'}
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
                Debug Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Campaign Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>ID: <Badge variant="outline">{result.analysis.campaign.id}</Badge></div>
                    <div>Thread ID: <Badge variant="outline">{result.analysis.campaign.thread_id || 'None'}</Badge></div>
                    <div>Status: <Badge variant="outline">{result.analysis.campaign.status}</Badge></div>
                    <div>Reply Status: <Badge variant="outline">{result.analysis.campaign.reply_status}</Badge></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Gmail Integration</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Email: <Badge variant="outline">{result.analysis.integration.email_address}</Badge></div>
                    <div>Active: <Badge variant={result.analysis.integration.is_active ? "default" : "secondary"}>{result.analysis.integration.is_active ? "Yes" : "No"}</Badge></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">History Tracking</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Already Processed: <Badge variant={result.analysis.historyTracking.alreadyProcessed ? "destructive" : "default"}>{result.analysis.historyTracking.alreadyProcessed ? "Yes" : "No"}</Badge></div>
                    <div>History ID: <Badge variant="outline">{result.analysis.historyTracking.historyId}</Badge></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Gmail History</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>History Count: <Badge variant="outline">{result.analysis.gmailHistory.historyCount}</Badge></div>
                    <div>Messages Added: <Badge variant="outline">{result.analysis.gmailHistory.messagesAdded}</Badge></div>
                    <div>Messages Deleted: <Badge variant="outline">{result.analysis.gmailHistory.messagesDeleted}</Badge></div>
                    <div>Labels Added: <Badge variant="outline">{result.analysis.gmailHistory.labelsAdded}</Badge></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Potential Issues</h3>
                  <div className="space-y-1">
                    {result.analysis.potentialIssues.map((issue: string, index: number) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Recommendation</h3>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">{result.recommendations}</p>
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