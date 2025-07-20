import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export class GmailNotificationTracker {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async trackNotification(notification: any): Promise<void> {
    try {
      console.log('Tracking Gmail notification:', notification);
      
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

      // Get Gmail history to see what changed
      const gmail = google.gmail({ version: 'v1', auth: this.getOAuth2Client(integration) });
      const history = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: historyId,
        historyTypes: ['messageAdded', 'messageDeleted', 'labelAdded', 'labelRemoved'],
      });

      console.log('Gmail history response:', {
        historyId,
        historyCount: history.data.history?.length || 0,
        history: history.data.history,
      });

      // Store the history tracking record
      await this.supabase
        .from('gmail_history_tracking')
        .insert({
          gmail_integration_id: integration.id,
          history_id: historyId,
        });

      console.log(`Successfully tracked history ID ${historyId}`);

      // Also process any new messages for reply detection
      if (history.data.history && history.data.history.length > 0) {
        for (const record of history.data.history) {
          for (const message of record.messagesAdded || []) {
            await this.checkForReplies(integration, message.message);
          }
        }
      }

    } catch (error) {
      console.error('Error tracking notification:', error);
    }
  }

  private async checkForReplies(integration: any, message: any): Promise<void> {
    try {
      console.log(`Checking message for replies: ${message.id}`);
      
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
      
      if (!fromHeader) {
        console.log('Missing From header');
        return;
      }

      // Check if sender is not the integration email (i.e., it's a reply)
      if (fromHeader.value && fromHeader.value.includes(integration.email_address)) {
        console.log('This is our own message, not a reply');
        return;
      }

      // Extract reply content
      const replyContent = this.extractMessageContent(messageDetails.data);
      
      console.log(`Reply detected for campaign ${campaign.id}:`, {
        from: fromHeader.value,
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
          reply_sender: fromHeader.value,
          reply_message_id: message.id,
          last_history_id: message.historyId,
        })
        .eq('id', campaign.id);

      console.log(`Successfully updated campaign ${campaign.id} with reply information`);

    } catch (error) {
      console.error('Error checking for replies:', error);
    }
  }

  private extractMessageContent(message: any): string {
    try {
      let rawContent = '';
      
      // Extract text content from Gmail message
      if (message.payload?.body?.data) {
        // Simple text message
        rawContent = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      } else if (message.payload?.parts) {
        // Multipart message
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            rawContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          }
          if (part.mimeType === 'text/html' && part.body?.data) {
            // For HTML messages, we'll return a simplified version
            const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
            // Remove HTML tags for storage
            rawContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            break;
          }
        }
      }
      
      if (!rawContent) {
        return 'No text content found';
      }

      // Clean up the content to extract only the actual reply
      return this.cleanReplyContent(rawContent);
    } catch (error) {
      console.error('Error extracting message content:', error);
      return 'Error extracting content';
    }
  }

  private cleanReplyContent(content: string): string {
    try {
      // First, try to extract just the first sentence/word before any email thread content
      const veryFirstPart = this.extractFirstReplyPart(content);
      if (veryFirstPart && veryFirstPart.length > 0 && veryFirstPart.length < 500) {
        return veryFirstPart;
      }

      // Fallback to the original method if the first part extraction doesn't work well
      const lines = content.split('\n');
      const cleanedLines: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) continue;
        
        // Skip lines that are clearly quoted content (start with >, >>>, etc.)
        if (trimmedLine.startsWith('>') || trimmedLine.startsWith('>>>')) {
          continue;
        }
        
        // Skip lines that contain email headers or signatures
        if (this.isEmailHeaderOrSignature(trimmedLine)) {
          continue;
        }
        
        // Skip lines that are just email addresses or dates
        if (this.isEmailAddressOrDate(trimmedLine)) {
          continue;
        }
        
        // Skip lines that are just "wrote:" or similar
        if (trimmedLine.toLowerCase().includes('wrote:') || trimmedLine.toLowerCase().includes('said:')) {
          continue;
        }
        
        // Skip lines that are just punctuation or very short
        if (trimmedLine.length < 3 || /^[^\w]*$/.test(trimmedLine)) {
          continue;
        }
        
        // Skip lines that contain email addresses in angle brackets
        if (trimmedLine.includes('<') && trimmedLine.includes('>') && trimmedLine.includes('@')) {
          continue;
        }
        
        // Add the line if it looks like actual content
        cleanedLines.push(trimmedLine);
        
        // Stop after the first meaningful line to avoid thread content
        break;
      }
      
      return cleanedLines.join(' ').trim() || 'Reply content could not be parsed';
    } catch (error) {
      console.error('Error cleaning reply content:', error);
      return 'Error parsing reply content';
    }
  }

  private extractFirstReplyPart(content: string): string {
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
      
      return cleaned;
    } catch (error) {
      console.error('Error extracting first reply part:', error);
      return '';
    }
  }

  private isEmailHeaderOrSignature(line: string): boolean {
    const headerPatterns = [
      /^From:/i,
      /^Sent:/i,
      /^To:/i,
      /^Subject:/i,
      /^Date:/i,
      /^Reply-To:/i,
      /^Cc:/i,
      /^Bcc:/i,
      /^Message-ID:/i,
      /^In-Reply-To:/i,
      /^References:/i,
      /^MIME-Version:/i,
      /^Content-Type:/i,
      /^Content-Transfer-Encoding:/i,
      /^X-Mailer:/i,
      /^X-Priority:/i,
      /^Importance:/i,
      /^--\s*$/, // Signature separator
      /^Best regards,/i,
      /^Sincerely,/i,
      /^Thanks,/i,
      /^Regards,/i,
      /^Kind regards,/i,
      /^Yours truly,/i,
      /^Cheers,/i,
      /^Best,/i,
    ];
    
    return headerPatterns.some(pattern => pattern.test(line));
  }

  private isEmailAddressOrDate(line: string): boolean {
    // Email address pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Date patterns (various formats)
    const datePatterns = [
      /^On .*? wrote:$/,
      /^On .*? at .*? .*? wrote:$/,
      /^\d{1,2}\/\d{1,2}\/\d{4}/,
      /^\d{4}-\d{2}-\d{2}/,
      /^[A-Za-z]{3} \d{1,2},? \d{4}/,
      /^\d{1,2} [A-Za-z]{3} \d{4}/,
    ];
    
    return emailPattern.test(line) || datePatterns.some(pattern => pattern.test(line));
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