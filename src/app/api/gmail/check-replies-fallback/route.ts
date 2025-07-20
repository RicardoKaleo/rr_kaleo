import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { gmailIntegrationId, campaignId } = await request.json();
    
    if (!gmailIntegrationId) {
      return NextResponse.json({ 
        error: 'Missing gmailIntegrationId parameter' 
      }, { status: 400 });
    }

    console.log(`Running fallback reply detection for integration: ${gmailIntegrationId}, campaign: ${campaignId}`);

    // Get Gmail integration
    const { data: integration, error: integrationError } = await supabase
      .from('gmail_integrations')
      .select('*')
      .eq('id', gmailIntegrationId)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ 
        error: 'Gmail integration not found or inactive',
        details: integrationError 
      }, { status: 404 });
    }

    const results = {
      integration: {
        id: integration.id,
        email: integration.email_address,
        isActive: integration.is_active
      },
      campaignsChecked: 0,
      repliesFound: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    // Method 1: Check campaigns by thread ID (existing method)
    if (campaignId) {
      const result = await checkCampaignByThreadId(integration, campaignId);
      results.details.push(result);
      if (result.replyFound) results.repliesFound++;
      results.campaignsChecked++;
    } else {
      // Check all campaigns for this integration
      const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('gmail_integration_id', integration.id)
        .eq('status', 'sent')
        .in('reply_status', ['sent', 'pending']);

      for (const campaign of campaigns || []) {
        const result = await checkCampaignByThreadId(integration, campaign.id);
        results.details.push(result);
        if (result.replyFound) results.repliesFound++;
        results.campaignsChecked++;
      }
    }

    // Method 2: Check recent messages in Gmail (fallback for missing thread IDs)
    const recentReplies = await checkRecentMessages(integration);
    results.details.push(...recentReplies);
    results.repliesFound += recentReplies.filter((r: any) => r.replyFound).length;

    // Method 3: Check by subject line matching (for campaigns without thread IDs)
    const subjectMatches = await checkBySubjectMatching(integration);
    results.details.push(...subjectMatches);
    results.repliesFound += subjectMatches.filter((r: any) => r.replyFound).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalCampaignsChecked: results.campaignsChecked,
        totalRepliesFound: results.repliesFound,
        totalErrors: results.errors.length
      }
    });

  } catch (error) {
    console.error('Error in fallback reply detection:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function checkCampaignByThreadId(integration: any, campaignId: string) {
  try {
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign || !campaign.thread_id) {
      return {
        method: 'thread_id',
        campaignId,
        replyFound: false,
        reason: 'No thread_id stored for campaign'
      };
    }

    const gmail = google.gmail({ version: 'v1', auth: getOAuth2Client(integration) });
    
    // Get the thread to check for new messages
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: campaign.thread_id,
    });

    const messages = thread.data.messages || [];
    const latestMessage = messages[messages.length - 1];
    
    if (!latestMessage) {
      return {
        method: 'thread_id',
        campaignId,
        replyFound: false,
        reason: 'No messages in thread'
      };
    }

    // Check if the latest message is a reply (not from us)
    const headers = latestMessage.payload?.headers || [];
    const fromHeader = headers.find((h: any) => h.name === 'From');
    
    if (!fromHeader || !fromHeader.value || fromHeader.value.includes(integration.email_address)) {
      return {
        method: 'thread_id',
        campaignId,
        replyFound: false,
        reason: 'Latest message is from us or missing From header'
      };
    }

    // Check if this is a new reply (after our campaign was sent)
    if (campaign.sent_at && latestMessage.internalDate) {
      const messageDate = new Date(parseInt(latestMessage.internalDate));
      const sentDate = new Date(campaign.sent_at);
      
      if (messageDate <= sentDate) {
        return {
          method: 'thread_id',
          campaignId,
          replyFound: false,
          reason: 'Latest message is before or same as campaign sent date'
        };
      }
    }

    // This is a new reply! Update the campaign
    const replyContent = extractMessageContent(latestMessage);
    
    await supabase
      .from('email_campaigns')
      .update({
        reply_status: 'replied',
        replied_at: new Date().toISOString(),
        reply_content: replyContent,
        reply_sender: fromHeader.value,
        reply_message_id: latestMessage.id,
        thread_id: campaign.thread_id, // Ensure thread_id is stored
      })
      .eq('id', campaign.id);

    return {
      method: 'thread_id',
      campaignId,
      replyFound: true,
      reason: 'New reply found and campaign updated',
      replyContent: replyContent.substring(0, 100) + '...'
    };

  } catch (error) {
    return {
      method: 'thread_id',
      campaignId,
      replyFound: false,
      reason: `Error: ${error}`
    };
  }
}

async function checkRecentMessages(integration: any) {
  try {
    const gmail = google.gmail({ version: 'v1', auth: getOAuth2Client(integration) });
    
    // Get recent messages (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const query = `after:${yesterday.toISOString().split('T')[0]}`;
    
    const messages = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    });

    const results = [];
    
    for (const message of messages.data.messages || []) {
      if (!message.id) continue;
      
      try {
        const messageDetails = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        const headers = messageDetails.data.payload?.headers || [];
        const fromHeader = headers.find((h: any) => h.name === 'From');
        const subjectHeader = headers.find((h: any) => h.name === 'Subject');
        
        // Skip if it's our own message
        if (!fromHeader || !fromHeader.value || fromHeader.value.includes(integration.email_address)) {
          continue;
        }

        // Check if this message thread matches any of our campaigns
        const threadId = messageDetails.data.threadId;
        const { data: campaign } = await supabase
          .from('email_campaigns')
          .select('*')
          .eq('thread_id', threadId)
          .eq('gmail_integration_id', integration.id)
          .eq('status', 'sent')
          .in('reply_status', ['sent', 'pending'])
          .single();

        if (campaign) {
          const replyContent = extractMessageContent(messageDetails.data);
          
          await supabase
            .from('email_campaigns')
            .update({
              reply_status: 'replied',
              replied_at: new Date().toISOString(),
              reply_content: replyContent,
              reply_sender: fromHeader.value,
              reply_message_id: message.id,
              thread_id: threadId,
            })
            .eq('id', campaign.id);

          results.push({
            method: 'recent_messages',
            campaignId: campaign.id,
            replyFound: true,
            reason: 'Reply found in recent messages',
            subject: subjectHeader?.value || 'No subject'
          });
        }
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        continue;
      }
    }

    return results;

  } catch (error) {
    return [{
      method: 'recent_messages',
      replyFound: false,
      reason: `Error: ${error}`
    }];
  }
}

async function checkBySubjectMatching(integration: any) {
  try {
    // Get campaigns without thread_id that were sent recently
    const { data: campaigns } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('gmail_integration_id', integration.id)
      .eq('status', 'sent')
      .in('reply_status', ['sent', 'pending'])
      .is('thread_id', null);

    if (!campaigns || campaigns.length === 0) {
      return [{
        method: 'subject_matching',
        replyFound: false,
        reason: 'No campaigns without thread_id found'
      }];
    }

    const gmail = google.gmail({ version: 'v1', auth: getOAuth2Client(integration) });
    const results = [];

    for (const campaign of campaigns) {
      // Get the job listing to extract company name
      const { data: jobListing } = await supabase
        .from('job_listings')
        .select('company, title')
        .eq('id', campaign.job_listing_id)
        .single();

      if (!jobListing) continue;

      // Search for messages with company name in subject
      const query = `subject:"${jobListing.company}" after:${new Date(campaign.sent_at).toISOString().split('T')[0]}`;
      
      const messages = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 10
      });

      for (const message of messages.data.messages || []) {
        if (!message.id) continue;
        
        try {
          const messageDetails = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });

          const headers = messageDetails.data.payload?.headers || [];
          const fromHeader = headers.find((h: any) => h.name === 'From');
          
          // Skip if it's our own message
          if (!fromHeader || !fromHeader.value || fromHeader.value.includes(integration.email_address)) {
            continue;
          }

          // This could be a reply! Update the campaign
          const replyContent = extractMessageContent(messageDetails.data);
          
          await supabase
            .from('email_campaigns')
            .update({
              reply_status: 'replied',
              replied_at: new Date().toISOString(),
              reply_content: replyContent,
              reply_sender: fromHeader.value,
              reply_message_id: message.id,
              thread_id: messageDetails.data.threadId,
            })
            .eq('id', campaign.id);

          results.push({
            method: 'subject_matching',
            campaignId: campaign.id,
            replyFound: true,
            reason: `Reply found by subject matching (${jobListing.company})`,
            company: jobListing.company
          });

          break; // Only take the first reply for this campaign
        } catch (error) {
          console.error(`Error processing subject match message ${message.id}:`, error);
          continue;
        }
      }
    }

    return results;

  } catch (error) {
    return [{
      method: 'subject_matching',
      replyFound: false,
      reason: `Error: ${error}`
    }];
  }
}

function extractMessageContent(message: any): string {
  try {
    let rawContent = '';
    
    if (message.payload?.body?.data) {
      rawContent = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          rawContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
          rawContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          break;
        }
      }
    }
    
    if (!rawContent) {
      return 'No text content found';
    }

    // Clean the content
    return cleanReplyContent(rawContent);
  } catch (error) {
    console.error('Error extracting message content:', error);
    return 'Error extracting content';
  }
}

function cleanReplyContent(content: string): string {
  try {
    // Remove all newlines and extra spaces first
    let cleaned = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Split by common email thread markers and take the first part
    const threadMarkers = [
      'On ',
      'From:',
      'Sent:',
      'To:',
      'Subject:',
      'wrote:',
      '<',
      '@'
    ];
    
    let shortestIndex = cleaned.length;
    for (const marker of threadMarkers) {
      const index = cleaned.indexOf(marker);
      if (index > 0 && index < shortestIndex) {
        shortestIndex = index;
      }
    }
    
    if (shortestIndex < cleaned.length) {
      cleaned = cleaned.substring(0, shortestIndex).trim();
    }
    
    // If still too long, take just the first sentence or first 100 characters
    if (cleaned.length > 100) {
      const firstSentence = cleaned.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 200) {
        cleaned = firstSentence.trim() + (cleaned.includes('.') || cleaned.includes('!') || cleaned.includes('?') ? '.' : '');
      } else {
        cleaned = cleaned.substring(0, 100) + '...';
      }
    }
    
    return cleaned || 'Reply content could not be parsed';
  } catch (error) {
    console.error('Error cleaning reply content:', error);
    return content;
  }
}

function getOAuth2Client(integration: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!
  );

  oauth2Client.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
  });

  return oauth2Client;
} 