import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { historyId, campaignId, gmailIntegrationId } = await request.json();
    
    if (!historyId || !campaignId || !gmailIntegrationId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: historyId, campaignId, gmailIntegrationId' 
      }, { status: 400 });
    }

    console.log(`Debugging reply detection for historyId: ${historyId}, campaignId: ${campaignId}`);

    // 1. Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ 
        error: 'Campaign not found',
        details: campaignError 
      }, { status: 404 });
    }

    // 2. Get Gmail integration details
    const { data: integration, error: integrationError } = await supabase
      .from('gmail_integrations')
      .select('*')
      .eq('id', gmailIntegrationId)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ 
        error: 'Gmail integration not found',
        details: integrationError 
      }, { status: 404 });
    }

    // 3. Check if history ID was already processed
    const { data: existingHistory, error: historyError } = await supabase
      .from('gmail_history_tracking')
      .select('*')
      .eq('gmail_integration_id', gmailIntegrationId)
      .eq('history_id', historyId)
      .single();

    // 4. Get Gmail history for this history ID
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!
    );

    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const history = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId,
      historyTypes: ['messageAdded', 'messageDeleted', 'labelAdded', 'labelRemoved'],
    });

    // 5. Analyze the history data
    const analysis: any = {
      campaign: {
        id: campaign.id,
        thread_id: campaign.thread_id,
        status: campaign.status,
        reply_status: campaign.reply_status,
        replied_at: campaign.replied_at,
        gmail_integration_id: campaign.gmail_integration_id
      },
      integration: {
        id: integration.id,
        email_address: integration.email_address,
        is_active: integration.is_active
      },
      historyTracking: {
        alreadyProcessed: !!existingHistory,
        historyId: historyId,
        error: historyError
      },
      gmailHistory: {
        historyId: history.data.historyId,
        historyCount: history.data.history?.length || 0,
        messagesAdded: history.data.history?.flatMap((h: any) => h.messagesAdded || []).length || 0,
        messagesDeleted: history.data.history?.flatMap((h: any) => h.messagesDeleted || []).length || 0,
        labelsAdded: history.data.history?.flatMap((h: any) => h.labelsAdded || []).length || 0,
        labelsRemoved: history.data.history?.flatMap((h: any) => h.labelsRemoved || []).length || 0
      },
      potentialIssues: []
    };

    // 6. Check for potential issues
    if (!campaign.thread_id) {
      analysis.potentialIssues.push('Campaign has no thread_id stored');
    }

    if (existingHistory) {
      analysis.potentialIssues.push('History ID was already processed');
    }

    if (analysis.gmailHistory.messagesAdded === 0) {
      analysis.potentialIssues.push('No new messages found in history');
    }

    if (campaign.gmail_integration_id !== gmailIntegrationId) {
      analysis.potentialIssues.push('Campaign Gmail integration ID mismatch');
    }

    // 7. If there are new messages, analyze them
    if (analysis.gmailHistory.messagesAdded > 0) {
      const newMessages = history.data.history?.flatMap((h: any) => h.messagesAdded || []) || [];
      
      for (const messageAdded of newMessages) {
        if (!messageAdded.message?.id) continue;
        
        try {
          const messageDetails = await gmail.users.messages.get({
            userId: 'me',
            id: messageAdded.message.id,
          });

          const threadId = messageDetails.data.threadId;
          const headers = messageDetails.data.payload?.headers || [];
          const fromHeader = headers.find((h: any) => h.name === 'From');
          
          analysis.potentialIssues.push(`New message found: ID=${messageAdded.message.id}, ThreadID=${threadId}, From=${fromHeader?.value || 'unknown'}`);
          
          if (threadId === campaign.thread_id) {
            analysis.potentialIssues.push(`✓ Message thread matches campaign thread`);
          } else {
            analysis.potentialIssues.push(`✗ Message thread (${threadId}) doesn't match campaign thread (${campaign.thread_id})`);
          }
          
          if (fromHeader?.value && fromHeader.value.includes(integration.email_address)) {
            analysis.potentialIssues.push(`✗ Message is from our own email (${integration.email_address}) - not a reply`);
          } else {
            analysis.potentialIssues.push(`✓ Message is from external sender - potential reply`);
          }
        } catch (error) {
          analysis.potentialIssues.push(`Error getting message details: ${error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      recommendations: analysis.potentialIssues.length > 0 ? 
        'Issues found that prevented reply detection' : 
        'No obvious issues found - reply should have been detected'
    });

  } catch (error) {
    console.error('Error debugging reply:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 