# Gmail Push/Pull Notifications Implementation Plan

## 🎯 Overview

This document outlines the implementation strategy for monitoring all client Gmail mailboxes for replies using Google's Push/Pull notification system. This will enable real-time reply tracking across all integrated client accounts.

## 📋 Prerequisites & Setup

### 1. Google Cloud Console Setup
```bash
# Required APIs to enable:
- Gmail API
- Pub/Sub API (for push notifications)
- Cloud Functions API (optional, for serverless processing)
```

### 2. Environment Variables
```env
# Add to your .env.local
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_PUBSUB_TOPIC=gmail-notifications
GOOGLE_PUBSUB_SUBSCRIPTION=gmail-replies-subscription
WEBHOOK_BASE_URL=https://your-domain.com/api/gmail/webhooks

# For webhook security (generate with: openssl rand -base64 32)
WEBHOOK_SECRET=your-webhook-verification-secret
```

### 3. Database Schema Extensions

```sql
-- Add to database-schema.sql

-- Gmail Watch Subscriptions (tracks active watches per mailbox)
CREATE TABLE gmail_watch_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_integration_id UUID REFERENCES gmail_integrations(id) ON DELETE CASCADE,
  history_id TEXT NOT NULL,
  expiration_time TIMESTAMP WITH TIME ZONE NOT NULL,
  topic_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gmail_integration_id)
);

-- Gmail History Tracking (stores processed history IDs)
CREATE TABLE gmail_history_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_integration_id UUID REFERENCES gmail_integrations(id) ON DELETE CASCADE,
  history_id TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gmail_integration_id, history_id)
);

-- Reply Tracking (enhanced email_campaigns table)
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_detected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_content TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_sender TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_message_id TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS last_history_id TEXT;

-- Indexes for performance
CREATE INDEX idx_gmail_watch_subscriptions_integration ON gmail_watch_subscriptions(gmail_integration_id);
CREATE INDEX idx_gmail_watch_subscriptions_active ON gmail_watch_subscriptions(is_active);
CREATE INDEX idx_gmail_history_tracking_integration_history ON gmail_history_tracking(gmail_integration_id, history_id);
CREATE INDEX idx_email_campaigns_thread_id ON email_campaigns(thread_id);
CREATE INDEX idx_email_campaigns_reply_status ON email_campaigns(reply_status);
```

## 🏗️ Architecture Overview

### 1. Push Notifications (Recommended)
```
User OAuth Token → Gmail Watch Setup → Gmail → Google Pub/Sub → Webhook → Your API → Database Update
```

### 2. Pull Notifications (Fallback)
```
Cron Job → User OAuth Token → Gmail API → History API → Process Changes → Database Update
```

## 🔐 Authentication Model

### **User OAuth (What You're Using)**
- Each client connects their own Gmail account via OAuth
- Your system stores their OAuth tokens
- You act on behalf of each individual user
- No service account needed for personal Gmail accounts

### **Service Account (Not Needed for Personal Gmail)**
- Used for Google Workspace admin operations
- Acts as the organization, not individual users
- Only needed for system-level integrations

## 🔧 Implementation Steps

### Phase 1: Infrastructure Setup

#### Step 1.1: Google Cloud Pub/Sub Setup
```bash
# Create Pub/Sub topic
gcloud pubsub topics create gmail-notifications

# Create subscription
gcloud pubsub subscriptions create gmail-replies-subscription \
  --topic=gmail-notifications \
  --ack-deadline=60 \
  --message-retention-duration=7d
```

#### Step 1.2: Pub/Sub Permissions
```bash
# Enable Pub/Sub API for your project
gcloud services enable pubsub.googleapis.com

# Create Pub/Sub topic (if not already created)
gcloud pubsub topics create gmail-notifications

# Create subscription
gcloud pubsub subscriptions create gmail-replies-subscription \
  --topic=gmail-notifications \
  --ack-deadline=60 \
  --message-retention-duration=7d
```

### Phase 2: Core Implementation

#### Step 2.1: Gmail Watch Service
```typescript
// src/lib/gmail-watch.ts
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export class GmailWatchService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  async setupWatchForIntegration(gmailIntegrationId: string): Promise<boolean> {
    try {
      // Get integration details (contains user's OAuth tokens)
      const { data: integration } = await this.supabase
        .from('gmail_integrations')
        .select('*')
        .eq('id', gmailIntegrationId)
        .single();

      if (!integration) throw new Error('Integration not found');

      // Refresh user's OAuth token if needed
      const tokens = await this.refreshTokens(integration);
      
      // Setup Gmail watch using user's OAuth credentials
      const gmail = google.gmail({ version: 'v1', auth: this.getOAuth2Client(tokens) });
      
      const watchResponse = await gmail.users.watch({
        userId: 'me', // This means "the authenticated user's mailbox"
        requestBody: {
          topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/topics/${process.env.GOOGLE_PUBSUB_TOPIC}`,
          labelIds: ['INBOX', 'SENT'], // Watch both inbox and sent
        },
      });

      // Store watch subscription
      await this.supabase
        .from('gmail_watch_subscriptions')
        .upsert({
          gmail_integration_id: gmailIntegrationId,
          history_id: watchResponse.data.historyId,
          expiration_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          topic_name: process.env.GOOGLE_PUBSUB_TOPIC,
          is_active: true,
        });

      return true;
    } catch (error) {
      console.error('Failed to setup Gmail watch:', error);
      return false;
    }
  }

  async refreshAllWatches(): Promise<void> {
    // Cron job to refresh watches before they expire
    const { data: expiringWatches } = await this.supabase
      .from('gmail_watch_subscriptions')
      .select('gmail_integration_id')
      .lt('expiration_time', new Date(Date.now() + 24 * 60 * 60 * 1000)) // Expire in next 24h
      .eq('is_active', true);

    for (const watch of expiringWatches || []) {
      await this.setupWatchForIntegration(watch.gmail_integration_id);
    }
  }

  private async refreshTokens(integration: any) {
    // Token refresh logic (similar to existing implementation)
  }

  private getOAuth2Client(tokens: any) {
    // OAuth2 client setup
  }
}
```

#### Step 2.2: Webhook Handler
```typescript
// src/app/api/gmail/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GmailReplyProcessor } from '@/lib/gmail-reply-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-goog-signature');
    
    // Verify webhook signature (Google Pub/Sub)
    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    
    // Handle Pub/Sub message
    if (data.message) {
      const message = JSON.parse(Buffer.from(data.message.data, 'base64').toString());
      
      // Process Gmail notification
      const processor = new GmailReplyProcessor();
      await processor.processNotification(message);
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function verifySignature(body: string, signature: string | null): boolean {
  // For Google Pub/Sub, you can verify the message came from Google
  // by checking the 'x-goog-signature' header
  // In production, implement proper signature verification
  return true; // Simplified for development
}
```

#### Step 2.3: Reply Processor
```typescript
// src/lib/gmail-reply-processor.ts
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export class GmailReplyProcessor {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  async processNotification(notification: any): Promise<void> {
    try {
      const { emailAddress, historyId } = notification;
      
      // Get Gmail integration for this email
      const { data: integration } = await this.supabase
        .from('gmail_integrations')
        .select('*')
        .eq('email_address', emailAddress)
        .eq('is_active', true)
        .single();

      if (!integration) {
        console.log(`No active integration found for ${emailAddress}`);
        return;
      }

      // Check if we've already processed this history ID
      const { data: existingHistory } = await this.supabase
        .from('gmail_history_tracking')
        .select('id')
        .eq('gmail_integration_id', integration.id)
        .eq('history_id', historyId)
        .single();

      if (existingHistory) {
        console.log(`History ID ${historyId} already processed`);
        return;
      }

      // Get Gmail history
      const gmail = google.gmail({ version: 'v1', auth: this.getOAuth2Client(integration) });
      const history = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: historyId,
        historyTypes: ['messageAdded'],
      });

      // Process new messages
      for (const record of history.data.history || []) {
        for (const message of record.messagesAdded || []) {
          await this.processNewMessage(integration, message.message);
        }
      }

      // Mark history as processed
      await this.supabase
        .from('gmail_history_tracking')
        .insert({
          gmail_integration_id: integration.id,
          history_id: historyId,
        });

    } catch (error) {
      console.error('Error processing notification:', error);
    }
  }

  private async processNewMessage(integration: any, message: any): Promise<void> {
    try {
      // Get message details
      const gmail = google.gmail({ version: 'v1', auth: this.getOAuth2Client(integration) });
      const messageDetails = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
      });

      const threadId = messageDetails.data.threadId;
      
      // Check if this thread matches any of our campaigns
      const { data: campaign } = await this.supabase
        .from('email_campaigns')
        .select('*')
        .eq('thread_id', threadId)
        .eq('gmail_integration_id', integration.id)
        .single();

      if (!campaign) {
        console.log(`No campaign found for thread ${threadId}`);
        return;
      }

      // Check if this is a reply (not our own message)
      const headers = messageDetails.data.payload?.headers || [];
      const fromHeader = headers.find(h => h.name === 'From');
      const toHeader = headers.find(h => h.name === 'To');
      
      if (!fromHeader || !toHeader) return;

      // Check if sender is not the integration email (i.e., it's a reply)
      if (fromHeader.value.includes(integration.email_address)) {
        console.log('This is our own message, not a reply');
        return;
      }

      // Extract reply content
      const replyContent = this.extractMessageContent(messageDetails.data);
      
      // Update campaign with reply information
      await this.supabase
        .from('email_campaigns')
        .update({
          reply_status: 'replied',
          replied_at: new Date().toISOString(),
          reply_content: replyContent,
          reply_sender: fromHeader.value,
          reply_message_id: message.id,
          last_history_id: message.historyId,
        })
        .eq('id', campaign.id);

      console.log(`Reply detected for campaign ${campaign.id}`);

    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  private extractMessageContent(message: any): string {
    // Extract text content from Gmail message
    // Implementation depends on message structure
    return '';
  }

  private getOAuth2Client(integration: any) {
    // OAuth2 client setup
  }
}
```

### Phase 3: Management & Monitoring

#### Step 3.1: Watch Management API
```typescript
// src/app/api/gmail/watch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GmailWatchService } from '@/lib/gmail-watch';

export async function POST(request: NextRequest) {
  try {
    const { gmailIntegrationId } = await request.json();
    
    const watchService = new GmailWatchService();
    const success = await watchService.setupWatchForIntegration(gmailIntegrationId);
    
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to setup watch' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    // Get all active watches for a client
    const { data: watches } = await supabase
      .from('gmail_watch_subscriptions')
      .select(`
        *,
        gmail_integrations!inner(client_id)
      `)
      .eq('gmail_integrations.client_id', clientId)
      .eq('is_active', true);
    
    return NextResponse.json({ watches });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get watches' }, { status: 500 });
  }
}
```

#### Step 3.2: Cron Jobs
```typescript
// src/app/api/cron/refresh-watches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GmailWatchService } from '@/lib/gmail-watch';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const watchService = new GmailWatchService();
    await watchService.refreshAllWatches();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to refresh watches' }, { status: 500 });
  }
}
```

### Phase 4: UI Integration

#### Step 4.1: Watch Status Component
```typescript
// src/components/GmailWatchStatus.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WatchStatusProps {
  clientId: string;
}

export function GmailWatchStatus({ clientId }: WatchStatusProps) {
  const [watches, setWatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatches();
  }, [clientId]);

  const fetchWatches = async () => {
    try {
      const response = await fetch(`/api/gmail/watch?clientId=${clientId}`);
      const data = await response.json();
      setWatches(data.watches || []);
    } catch (error) {
      console.error('Failed to fetch watches:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupWatch = async (integrationId: string) => {
    try {
      const response = await fetch('/api/gmail/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmailIntegrationId: integrationId }),
      });
      
      if (response.ok) {
        fetchWatches(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to setup watch:', error);
    }
  };

  if (loading) return <div>Loading watch status...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gmail Watch Status</CardTitle>
      </CardHeader>
      <CardContent>
        {watches.length === 0 ? (
          <p className="text-muted-foreground">No active watches</p>
        ) : (
          <div className="space-y-2">
            {watches.map((watch) => (
              <div key={watch.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{watch.gmail_integrations.email_address}</p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(watch.expiration_time).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={watch.is_active ? 'default' : 'secondary'}>
                  {watch.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## 🔄 Deployment & Configuration

### 1. Vercel Configuration
```json
// vercel.json
{
  "functions": {
    "src/app/api/gmail/webhooks/route.ts": {
      "maxDuration": 30
    },
    "src/app/api/cron/refresh-watches/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### 2. Cron Job Setup
```bash
# Using Vercel Cron (recommended)
# Add to vercel.json
{
  "crons": [
    {
      "path": "/api/cron/refresh-watches",
      "schedule": "0 2 * * *"
    }
  ]
}

# Alternative: External cron service
# Run daily at 2 AM to refresh watches before expiration
0 2 * * * curl -X POST https://your-domain.com/api/cron/refresh-watches \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 3. Environment Variables
```env
# Production environment variables
GOOGLE_CLOUD_PROJECT_ID=your-production-project
GOOGLE_PUBSUB_TOPIC=gmail-notifications-prod
GOOGLE_PUBSUB_SUBSCRIPTION=gmail-replies-subscription-prod
GMAIL_WATCH_SECRET=your-production-secret
WEBHOOK_BASE_URL=https://your-production-domain.com/api/gmail/webhooks
CRON_SECRET=your-cron-secret
```

## 📊 Monitoring & Analytics

### 1. Watch Health Monitoring
```typescript
// src/app/api/gmail/watch/health/route.ts
export async function GET() {
  const { data: watches } = await supabase
    .from('gmail_watch_subscriptions')
    .select('*')
    .eq('is_active', true);

  const expiringSoon = watches?.filter(w => 
    new Date(w.expiration_time) < new Date(Date.now() + 24 * 60 * 60 * 1000)
  ) || [];

  const expired = watches?.filter(w => 
    new Date(w.expiration_time) < new Date()
  ) || [];

  return NextResponse.json({
    total: watches?.length || 0,
    expiringSoon: expiringSoon.length,
    expired: expired.length,
    health: expired.length === 0 ? 'healthy' : 'needs_attention'
  });
}
```

### 2. Reply Analytics
```typescript
// src/app/api/analytics/replies/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const days = parseInt(searchParams.get('days') || '30');

  const { data: replies } = await supabase
    .from('email_campaigns')
    .select(`
      *,
      job_listings!inner(client_id)
    `)
    .eq('job_listings.client_id', clientId)
    .eq('reply_status', 'replied')
    .gte('replied_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

  return NextResponse.json({
    totalReplies: replies?.length || 0,
    replyRate: calculateReplyRate(replies),
    averageResponseTime: calculateAverageResponseTime(replies)
  });
}
```

## 🚀 Implementation Timeline

### Week 1: Infrastructure Setup
- [ ] Google Cloud Console setup
- [ ] Pub/Sub topic and subscription creation
- [ ] Service account configuration
- [ ] Database schema updates

### Week 2: Core Implementation
- [ ] GmailWatchService implementation
- [ ] Webhook handler setup
- [ ] Reply processor logic
- [ ] Basic testing

### Week 3: Management & UI
- [ ] Watch management API
- [ ] UI components for watch status
- [ ] Cron job setup
- [ ] Error handling and retry logic

### Week 4: Testing & Deployment
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Production deployment
- [ ] Monitoring setup

## ⚠️ Important Considerations

### 1. Rate Limits
- Gmail API: 1 billion queries per day per project
- Pub/Sub: 10,000 messages per second per topic
- Watch subscriptions: 1 per user per topic

### 2. Security
- Always verify webhook signatures
- Use service accounts with minimal permissions
- Encrypt sensitive data in database
- Implement proper error handling

### 3. Reliability
- Implement retry logic for failed operations
- Monitor watch subscription health
- Set up alerts for system failures
- Regular backup of watch configurations

### 4. Cost Optimization
- Monitor Pub/Sub usage and costs
- Implement efficient message processing
- Consider batch processing for high-volume scenarios
- Use appropriate instance sizes for processing

## 🎯 Success Metrics

- **Reply Detection Rate**: >95% of replies detected within 5 minutes
- **System Uptime**: >99.9% availability
- **Processing Latency**: <30 seconds from notification to database update
- **Error Rate**: <1% of notifications fail to process
- **Cost Efficiency**: <$50/month for 1000 active watches

This implementation provides a robust, scalable solution for monitoring all client Gmail mailboxes with real-time reply detection and comprehensive management capabilities. 