import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export class GmailWatchService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async setupWatchForIntegration(gmailIntegrationId: string): Promise<boolean> {
    try {
      console.log(`Setting up Gmail watch for integration: ${gmailIntegrationId}`);
      
      // Get integration details (contains user's OAuth tokens)
      const { data: integration } = await this.supabase
        .from('gmail_integrations')
        .select('*')
        .eq('id', gmailIntegrationId)
        .single();

      if (!integration) {
        console.error('Integration not found:', gmailIntegrationId);
        throw new Error('Integration not found');
      }

      // Refresh user's OAuth token if needed
      const tokens = await this.refreshTokens(integration);
      
      // Setup Gmail watch using user's OAuth credentials
      const gmail = google.gmail({ version: 'v1', auth: this.getOAuth2Client(tokens) });
      
      // Setup Gmail watch with Pub/Sub for notifications
      const watchResponse = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          labelIds: ['INBOX', 'SENT'],
          labelFilterAction: 'include',
          // The topic name must be in the format: projects/PROJECT_ID/topics/TOPIC_NAME
          topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/topics/${process.env.GOOGLE_PUBSUB_TOPIC}`
        },
      });

      console.log('Gmail watch response:', watchResponse.data);

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

      console.log(`Successfully set up Gmail watch for ${integration.email_address}`);
      return true;
    } catch (error) {
      console.error('Failed to setup Gmail watch:', error);
      return false;
    }
  }

  async refreshAllWatches(): Promise<void> {
    console.log('Refreshing all Gmail watches...');
    
    // Cron job to refresh watches before they expire
    const { data: expiringWatches } = await this.supabase
      .from('gmail_watch_subscriptions')
      .select('gmail_integration_id')
      .lt('expiration_time', new Date(Date.now() + 24 * 60 * 60 * 1000)) // Expire in next 24h
      .eq('is_active', true);

    console.log(`Found ${expiringWatches?.length || 0} watches to refresh`);

    for (const watch of expiringWatches || []) {
      console.log(`Refreshing watch for integration: ${watch.gmail_integration_id}`);
      await this.setupWatchForIntegration(watch.gmail_integration_id);
    }
  }

  async stopWatchForIntegration(gmailIntegrationId: string): Promise<boolean> {
    try {
      console.log(`Stopping Gmail watch for integration: ${gmailIntegrationId}`);
      
      // Get integration details
      const { data: integration } = await this.supabase
        .from('gmail_integrations')
        .select('*')
        .eq('id', gmailIntegrationId)
        .single();

      if (!integration) {
        console.error('Integration not found:', gmailIntegrationId);
        return false;
      }

      // Refresh tokens
      const tokens = await this.refreshTokens(integration);
      
      // Stop Gmail watch
      const gmail = google.gmail({ version: 'v1', auth: this.getOAuth2Client(tokens) });
      
      await gmail.users.stop({
        userId: 'me',
      });

      // Update database
      await this.supabase
        .from('gmail_watch_subscriptions')
        .update({ is_active: false })
        .eq('gmail_integration_id', gmailIntegrationId);

      console.log(`Successfully stopped Gmail watch for ${integration.email_address}`);
      return true;
    } catch (error) {
      console.error('Failed to stop Gmail watch:', error);
      return false;
    }
  }

  private async refreshTokens(integration: any) {
    try {
      // Check if token is expired or will expire soon
      const expiresAt = new Date(integration.token_expires_at);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiresAt <= fiveMinutesFromNow) {
        console.log('Refreshing expired token for:', integration.email_address);
        
        const oauth2Client = new google.auth.OAuth2(
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          process.env.GOOGLE_CLIENT_SECRET!,
          process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!
        );

        oauth2Client.setCredentials({
          refresh_token: integration.refresh_token,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update tokens in database
        await this.supabase
          .from('gmail_integrations')
          .update({
            access_token: credentials.access_token,
            token_expires_at: new Date(credentials.expiry_date!).toISOString(),
          })
          .eq('id', integration.id);

        return {
          access_token: credentials.access_token,
          refresh_token: integration.refresh_token,
        };
      }

      return {
        access_token: integration.access_token,
        refresh_token: integration.refresh_token,
      };
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      throw error;
    }
  }

  private getOAuth2Client(tokens: any) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!
    );

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    return oauth2Client;
  }
} 