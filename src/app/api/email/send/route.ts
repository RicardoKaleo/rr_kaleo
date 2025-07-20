import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { replaceTemplateVariables } from '@/lib/utils';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

interface SendEmailRequest {
  jobListingId: string;
  templateId?: string;
  customSubject: string;
  customBody: string;
  recipientEmail: string;
  recipientName: string;
  resumeFile: {
    name: string;
    content: string; // base64 encoded
    type: string;
  };
  followUpEmails: Array<{
    enabled: boolean;
    templateId?: string;
    daysAfter: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, { ...options });
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SendEmailRequest = await request.json();
    const { 
      jobListingId, 
      templateId, 
      customSubject, 
      customBody, 
      recipientEmail, 
      recipientName,
      resumeFile,
      followUpEmails 
    } = body;

    // Fetch all the data needed for variable replacement
    const { data: jobListingData, error: jobDataError } = await supabase
      .from('job_listings')
      .select(`
        *,
        clients(
          first_name,
          last_name,
          phone
        ),
        job_recruiters(
          recruiters(
            name
          )
        )
      `)
      .eq('id', jobListingId)
      .single();

    if (jobDataError || !jobListingData) {
      return NextResponse.json(
        { error: 'Job listing data not found' },
        { status: 404 }
      );
    }

    // Prepare variable replacement data with null checks
    const variableData = {
      client_first_name: jobListingData.clients?.first_name || '',
      client_last_name: jobListingData.clients?.last_name || '',
      client_phone: jobListingData.clients?.phone || '',
      job_title: jobListingData.title || '',
      job_company: jobListingData.company || '',
      recruiter_name: jobListingData.job_recruiters?.[0]?.recruiters?.name || ''
    };

    // Replace variables in subject and body
    const processedSubject = replaceTemplateVariables(customSubject, variableData);
    const processedBody = replaceTemplateVariables(customBody, variableData);

    // Use the client_id from the job listing data we already fetched
    const clientId = jobListingData.client_id;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Job listing is not associated with a client' },
        { status: 400 }
      );
    }

    // Get user's Gmail integration for this client
    const { data: gmailIntegration, error: gmailError } = await supabase
      .from('gmail_integrations')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single();

    if (gmailError || !gmailIntegration) {
      return NextResponse.json(
        { error: 'No active Gmail integration found. Please connect your Gmail account first.' },
        { status: 400 }
      );
    }

    // Check if token is expired and refresh if needed
    const tokenExpiresAt = new Date(gmailIntegration.token_expires_at);
    if (tokenExpiresAt <= new Date()) {
      // Refresh token directly
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: gmailIntegration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        return NextResponse.json(
          { error: 'Gmail token expired and failed to refresh. Please reconnect your Gmail account.' },
          { status: 400 }
        );
      }

      const tokens = await tokenResponse.json();
      
      // Calculate new expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

      // Update the integration with new tokens
      const { error: updateError } = await supabase
        .from('gmail_integrations')
        .update({
          access_token: tokens.access_token,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq('id', gmailIntegration.id);

      if (updateError) {
        console.error('Failed to update integration:', updateError);
        return NextResponse.json(
          { error: 'Failed to update Gmail integration' },
          { status: 500 }
        );
      }

      // Update local integration object
      gmailIntegration.access_token = tokens.access_token;
      gmailIntegration.token_expires_at = expiresAt.toISOString();
    }

    // Create email message with attachment
    const boundary = 'boundary_' + Math.random().toString(36).substring(2);
    const emailContent = createMultipartEmail(
      boundary,
      gmailIntegration.email_address,
      recipientEmail,
      processedSubject, // Use processed subject with variables replaced
      processedBody,    // Use processed body with variables replaced
      resumeFile
    );

    const message = {
      raw: Buffer.from(emailContent).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
    };

    // Send email via Gmail API
    const gmailResponse = await fetch(`${GMAIL_API_BASE}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gmailIntegration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text();
      console.error('Gmail API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to send email via Gmail API' },
        { status: 500 }
      );
    }

    const gmailResult = await gmailResponse.json();

    // Get user's Drive integration for file upload
    const { data: driveIntegration, error: driveError } = await supabase
      .from('google_drive_integrations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    let driveFileUrl = null;
    if (driveIntegration && !driveError) {
      // Check if Drive token needs refresh
      const driveTokenExpiresAt = new Date(driveIntegration.token_expires_at);
      if (driveTokenExpiresAt <= new Date()) {
        console.log('Google Drive token expired, refreshing...');
        // Refresh token directly using Drive credentials
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
                refresh_token: driveIntegration.refresh_token,
                grant_type: 'refresh_token',
            }),
        });

        if (!tokenResponse.ok) {
            console.error('Failed to refresh Drive token:', await tokenResponse.text());
        } else {
            const tokens = await tokenResponse.json();
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

            // Update the integration with new tokens
            const { error: updateError } = await supabase
                .from('google_drive_integrations')
                .update({
                    access_token: tokens.access_token,
                    token_expires_at: expiresAt.toISOString(),
                })
                .eq('id', driveIntegration.id);
            
            if (updateError) {
                console.error('Failed to update Drive integration after refresh:', updateError);
            } else {
                // Update local integration object
                driveIntegration.access_token = tokens.access_token;
                console.log('Google Drive token refreshed successfully.');
            }
        }
      }

      // Upload file to Google Drive using direct upload
      const fileName = `${clientId}_${jobListingId}.pdf`;
      
      console.log('GOOGLE_DRIVE_FOLDER_ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);
      
      let metadata: any = {
        name: fileName,
        mimeType: 'application/pdf'
      };

      // Test folder access if folder ID is provided
      if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
        // For Shared Drives, we need to use the drives API endpoint
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        let folderTestResponse;
        
        // First try the regular files endpoint
        folderTestResponse = await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${folderId}`, {
          headers: {
            'Authorization': `Bearer ${driveIntegration.access_token}`,
          },
        });
        
        // If that fails, try the drives endpoint for Shared Drives
        if (!folderTestResponse.ok) {
          console.log('Regular folder access failed, trying Shared Drive...');
          folderTestResponse = await fetch(`${GOOGLE_DRIVE_API_BASE}/drives/${folderId}`, {
            headers: {
              'Authorization': `Bearer ${driveIntegration.access_token}`,
            },
          });
        }
        
        if (!folderTestResponse.ok) {
          console.error('Cannot access Google Drive folder:', await folderTestResponse.text());
          console.log('Uploading to root folder instead');
        } else {
          console.log('Folder access confirmed');
          // For Shared Drives, don't specify parents - upload to root of the Shared Drive
          // The folderId is actually the Shared Drive ID, not a folder within it
          console.log('Uploading to Shared Drive root (no parent folder specified)');
        }
      }

      console.log('Drive upload metadata:', metadata);

      /* -------- Upload to Shared Drive with googleapis library -------- */
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: driveIntegration.access_token });

      const drive = google.drive({ version: 'v3', auth });

      const fileMetadata = {
        name: metadata.name,
        driveId: process.env.GOOGLE_DRIVE_FOLDER_ID,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      };

      const media = {
        mimeType: 'application/pdf',
        body: Readable.from(Buffer.from(resumeFile.content, 'base64')),
      };

      try {
        const file = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          supportsAllDrives: true,
          fields: 'id, webViewLink',
        });

        if (file.data.id && file.data.webViewLink) {
          // Make the file accessible to anyone with the link
          await drive.permissions.create({
            fileId: file.data.id,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
            supportsAllDrives: true,
          });
          driveFileUrl = file.data.webViewLink;
        } else {
           console.error('Google Drive file upload failed: No file ID or webViewLink returned');
        }
      } catch (err) {
        console.error('Google Drive file upload failed:', err);
      }
    } else {
      console.log('No Drive integration found, skipping file upload');
    }

    // Insert email campaign record with thread tracking
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        job_listing_id: jobListingId,
        gmail_integration_id: gmailIntegration.id,
        template_id: templateId || null,
        custom_subject: processedSubject, // Store processed subject
        custom_body: processedBody,       // Store processed body
        resume_file_url: driveFileUrl,
        status: 'sent',
        sent_at: new Date().toISOString(),
        thread_id: gmailResult.threadId, // Store the Gmail thread ID for tracking
        reply_status: 'sent', // Initial status after sending
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Failed to insert campaign record:', campaignError);
      return NextResponse.json(
        { error: 'Email sent but failed to record in database' },
        { status: 500 }
      );
    }

    // Insert follow-up configuration if any follow-ups are enabled
    const hasFollowUps = followUpEmails.some(fu => fu.enabled);
    if (hasFollowUps && campaign) {
      await supabase
        .from('email_campaign_followups')
        .insert({
          campaign_id: campaign.id,
          second_followup_enabled: followUpEmails[0].enabled,
          second_followup_template_id: followUpEmails[0].enabled ? followUpEmails[0].templateId : null,
          second_followup_days_after: followUpEmails[0].daysAfter,
          third_followup_enabled: followUpEmails[1].enabled,
          third_followup_template_id: followUpEmails[1].enabled ? followUpEmails[1].templateId : null,
          third_followup_days_after: followUpEmails[1].daysAfter,
        });
    }

    return NextResponse.json({
      success: true,
      messageId: gmailResult.id,
      threadId: gmailResult.threadId,
      campaignId: campaign.id,
      driveFileUrl
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function createMultipartEmail(
  boundary: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  body: string,
  resumeFile: { name: string; content: string; type: string }
): string {
  const emailParts = [
    `From: ${fromEmail}`,
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    '',
    body,
    '',
    `--${boundary}`,
    `Content-Type: ${resumeFile.type}`,
    `Content-Transfer-Encoding: base64`,
    `Content-Disposition: attachment; filename="${resumeFile.name}"`,
    '',
    resumeFile.content,
    '',
    `--${boundary}--`
  ];

  return emailParts.join('\r\n');
}



 