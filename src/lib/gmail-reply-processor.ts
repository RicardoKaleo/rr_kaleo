import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export class GmailReplyProcessor {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async processNotification(notification: any): Promise<void> {
    try {
      console.log('Processing Gmail notification:', notification);
      
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

      console.log('Gmail history response:', {
        historyId,
        historyCount: history.data.history?.length || 0,
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

      console.log(`Successfully processed history ID ${historyId}`);

    } catch (error) {
      console.error('Error processing notification:', error);
    }
  }

  private async processNewMessage(integration: any, message: any): Promise<void> {
    try {
      console.log(`Processing new message: ${message.id}`);
      
      // Get message details
      const gmail = google.gmail({ version: 'v1', auth: this.getOAuth2Client(integration) });
      const messageDetails = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
      });

      const threadId = messageDetails.data.threadId;
      
      // Extract sender email from headers
      const headers = messageDetails.data.payload?.headers || [];
      const fromHeader = headers.find(h => h.name === 'From');
      const toHeader = headers.find(h => h.name === 'To');
      
      if (!fromHeader || !toHeader) {
        console.log('Missing From or To headers');
        return;
      }

      // Extract email addresses from headers
      const senderEmail = this.extractEmailFromHeader(fromHeader.value || '');
      const recipientEmail = this.extractEmailFromHeader(toHeader.value || '');
      
      console.log('Message details:', {
        threadId,
        senderEmail,
        recipientEmail,
        fromHeader: fromHeader.value,
        toHeader: toHeader.value
      });
      
      // First try: Check if this thread matches any of our campaigns
      let { data: campaign } = await this.supabase
        .from('email_campaigns')
        .select('*')
        .eq('thread_id', threadId)
        .eq('gmail_integration_id', integration.id)
        .single();

      // Fallback: If no thread match, check if sender email matches any campaign recipient
      if (!campaign && senderEmail) {
        console.log(`No thread match found, checking sender email: ${senderEmail}`);
        const { data: emailMatchCampaign } = await this.supabase
          .from('email_campaigns')
          .select('*')
          .eq('recipient_email', senderEmail)
          .eq('gmail_integration_id', integration.id)
          .eq('reply_status', 'pending') // Only match campaigns that haven't been replied to
          .order('sent_at', { ascending: false }) // Get the most recent campaign
          .limit(1)
          .single();
        
        if (emailMatchCampaign) {
          campaign = emailMatchCampaign;
          console.log(`Found campaign by email match: ${campaign.id}`);
        }
      }

      if (!campaign) {
        console.log(`No campaign found for thread ${threadId} or sender ${senderEmail}`);
        return;
      }

      // Check if sender is not the integration email (i.e., it's a reply)
      if (senderEmail && senderEmail.includes(integration.email_address)) {
        console.log('This is our own message, not a reply');
        return;
      }

      // Extract reply content
      const replyContent = this.extractMessageContent(messageDetails.data);
      
      console.log(`Reply detected for campaign ${campaign.id}:`, {
        from: senderEmail,
        threadId,
        messageId: message.id,
      });
      
      // Update campaign with reply information
      await this.supabase
        .from('email_campaigns')
        .update({
          reply_status: 'replied',
          replied_at: new Date().toISOString(),
          reply_content: replyContent,
          reply_sender: senderEmail,
          reply_message_id: message.id,
          last_history_id: message.historyId,
        })
        .eq('id', campaign.id);

      console.log(`Successfully updated campaign ${campaign.id} with reply information`);

    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  private extractEmailFromHeader(headerValue: string): string {
    try {
      // Extract email from header value like "John Doe <john@example.com>" or "john@example.com"
      const emailMatch = headerValue.match(/<(.+?)>/) || headerValue.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      return emailMatch ? emailMatch[1] || emailMatch[0] : headerValue;
    } catch (error) {
      console.error('Error extracting email from header:', error);
      return headerValue;
    }
  }

  private extractMessageContent(message: any): string {
    try {
      // Extract text content from Gmail message
      if (message.payload?.body?.data) {
        // Simple text message
        return Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      } else if (message.payload?.parts) {
        // Multipart message
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
          if (part.mimeType === 'text/html' && part.body?.data) {
            // For HTML messages, we'll return a simplified version
            const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
            // Remove HTML tags for storage (you might want to keep HTML in production)
            return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
      }
      
      return 'No text content found';
    } catch (error) {
      console.error('Error extracting message content:', error);
      return 'Error extracting content';
    }
  }

  private getOAuth2Client(integration: any) {
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
} 