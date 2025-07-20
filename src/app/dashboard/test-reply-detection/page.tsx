'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const supabase = createBrowserSupabaseClient();

export default function TestReplyDetection() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);

  const createTestCampaign = async () => {
    setLoading(true);
    try {
      // Get the first active Gmail integration
      const { data: integration } = await supabase
        .from('gmail_integrations')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!integration) {
        setMessage('No active Gmail integration found. Please connect a Gmail account first.');
        return;
      }

      // Create a test campaign
      const { data: campaign, error } = await supabase
        .from('email_campaigns')
        .insert({
          gmail_integration_id: integration.id,
          custom_subject: 'Test Campaign - Reply Detection',
          custom_body: 'This is a test email to verify reply detection. Please reply to this email.',
          thread_id: `test-thread-${Date.now()}`, // Generate a unique thread ID
          status: 'sent',
          sent_at: new Date().toISOString(),
          reply_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setMessage(`Test campaign created! Campaign ID: ${campaign.id}`);
      loadCampaigns();
    } catch (error) {
      console.error('Error creating test campaign:', error);
      setMessage('Failed to create test campaign');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          gmail_integrations(email_address)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadReplies = async () => {
    try {
      const { data } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          gmail_integrations(email_address)
        `)
        .eq('reply_status', 'replied')
        .order('replied_at', { ascending: false })
        .limit(10);

      setReplies(data || []);
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const simulateReply = async (campaignId: string) => {
    setLoading(true);
    try {
      // Simulate a reply by updating the campaign
      const { error } = await supabase
        .from('email_campaigns')
        .update({
          reply_status: 'replied',
          replied_at: new Date().toISOString(),
          reply_content: 'This is a simulated reply for testing purposes.',
          reply_sender: 'test@example.com',
          reply_message_id: `simulated-${Date.now()}`
        })
        .eq('id', campaignId);

      if (error) throw error;

      setMessage('Reply simulation completed!');
      loadCampaigns();
      loadReplies();
    } catch (error) {
      console.error('Error simulating reply:', error);
      setMessage('Failed to simulate reply');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useState(() => {
    loadCampaigns();
    loadReplies();
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Test Reply Detection</h1>
      
      {message && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Test Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={createTestCampaign} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Test Campaign'}
            </Button>
            
            <Button 
              onClick={() => { loadCampaigns(); loadReplies(); }} 
              variant="outline"
              className="w-full"
            >
              Refresh Data
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Create a test campaign</p>
            <p>2. Send an email to your connected Gmail account</p>
            <p>3. Reply to that email from your Gmail</p>
            <p>4. Check the "Recent Replies" section below</p>
            <p>5. Or simulate a reply using the button</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-muted-foreground">No campaigns found</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{campaign.custom_subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.gmail_integrations?.email_address} • {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      Status: <span className={campaign.reply_status === 'replied' ? 'text-green-600' : 'text-yellow-600'}>
                        {campaign.reply_status}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {campaign.reply_status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => simulateReply(campaign.id)}
                        disabled={loading}
                      >
                        Simulate Reply
                      </Button>
                    )}
                    {campaign.reply_status === 'replied' && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Replies */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Replies</CardTitle>
        </CardHeader>
        <CardContent>
          {replies.length === 0 ? (
            <p className="text-muted-foreground">No replies detected yet</p>
          ) : (
            <div className="space-y-2">
              {replies.map((reply) => (
                <div key={reply.id} className="p-3 border rounded">
                  <p className="font-medium">{reply.custom_subject}</p>
                  <p className="text-sm text-muted-foreground">
                    From: {reply.reply_sender} • {new Date(reply.replied_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm mt-2">{reply.reply_content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 