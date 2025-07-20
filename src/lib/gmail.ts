import { createBrowserSupabaseClient } from './supabase/client';

// Gmail OAuth 2.0 Configuration
const GMAIL_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
  scopes: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ].join(' ')
};

// Gmail API endpoints
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface GmailTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  email_address?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload?: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      headers: Array<{ name: string; value: string }>;
      body?: {
        data?: string;
      };
    }>;
  };
}

export interface GmailIntegration {
  id: string;
  client_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  email_address: string;
  is_active: boolean;
  created_at: string;
}

// OAuth 2.0 Flow Functions
export function initiateGmailOAuth() {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', GMAIL_CONFIG.clientId);
  authUrl.searchParams.append('redirect_uri', GMAIL_CONFIG.redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', GMAIL_CONFIG.scopes);
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');
  
  window.location.href = authUrl.toString();
}

export async function exchangeCodeForTokens(code: string): Promise<GmailTokenResponse> {
  const response = await fetch('/api/gmail/oauth/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
}

// Token Management
export async function saveGmailIntegration(
  clientId: string,
  tokens: GmailTokenResponse,
  emailAddress: string
): Promise<GmailIntegration> {
  const supabase = createBrowserSupabaseClient();
  
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

  // First, deactivate any existing integrations for this client
  await supabase
    .from('gmail_integrations')
    .update({ is_active: false })
    .eq('client_id', clientId);

  // Then create the new integration
  const { data, error } = await supabase
    .from('gmail_integrations')
    .insert({
      client_id: clientId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt.toISOString(),
      email_address: emailAddress,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getGmailIntegration(clientId: string): Promise<GmailIntegration | null> {
  const supabase = createBrowserSupabaseClient();
  
  const { data, error } = await supabase
    .from('gmail_integrations')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function refreshGmailToken(integrationId: string): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  
  // Get current integration
  const { data: integration, error: fetchError } = await supabase
    .from('gmail_integrations')
    .select('*')
    .eq('id', integrationId)
    .single();

  if (fetchError) throw fetchError;

  // Refresh token via API
  const response = await fetch('/api/gmail/refresh-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      refresh_token: integration.refresh_token,
      integration_id: integrationId 
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }
}

// Gmail API Functions
export async function sendGmailMessage(
  integrationId: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<{ messageId: string; threadId: string }> {
  // Ensure token is fresh
  await refreshGmailToken(integrationId);
  
  const supabase = createBrowserSupabaseClient();
  const { data: integration } = await supabase
    .from('gmail_integrations')
    .select('access_token')
    .eq('id', integrationId)
    .single();

  if (!integration) throw new Error('Gmail integration not found');

  const message = {
    threadId,
    raw: btoa(
      `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      `Content-Type: text/html; charset=UTF-8\r\n` +
      `\r\n` +
      `${body}`
    ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  };

  const response = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  const result = await response.json();
  return {
    messageId: result.id,
    threadId: result.threadId
  };
}

export async function getGmailMessages(
  integrationId: string,
  query: string = '',
  maxResults: number = 10
): Promise<GmailMessage[]> {
  // Ensure token is fresh
  await refreshGmailToken(integrationId);
  
  const supabase = createBrowserSupabaseClient();
  const { data: integration } = await supabase
    .from('gmail_integrations')
    .select('access_token')
    .eq('id', integrationId)
    .single();

  if (!integration) throw new Error('Gmail integration not found');

  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
  });

  if (query) {
    params.append('q', query);
  }

  const response = await fetch(`${GMAIL_API_BASE}/messages?${params}`, {
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  const result = await response.json();
  return result.messages || [];
}

export async function getGmailMessage(
  integrationId: string,
  messageId: string
): Promise<GmailMessage> {
  // Ensure token is fresh
  await refreshGmailToken(integrationId);
  
  const supabase = createBrowserSupabaseClient();
  const { data: integration } = await supabase
    .from('gmail_integrations')
    .select('access_token')
    .eq('id', integrationId)
    .single();

  if (!integration) throw new Error('Gmail integration not found');

  const response = await fetch(`${GMAIL_API_BASE}/messages/${messageId}`, {
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch message');
  }

  return response.json();
}

export async function getGmailProfile(integrationId: string): Promise<{ emailAddress: string }> {
  // Ensure token is fresh
  await refreshGmailToken(integrationId);
  
  const supabase = createBrowserSupabaseClient();
  const { data: integration } = await supabase
    .from('gmail_integrations')
    .select('access_token')
    .eq('id', integrationId)
    .single();

  if (!integration) throw new Error('Gmail integration not found');

  const response = await fetch(`${GMAIL_API_BASE}/profile`, {
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}



// Utility Functions
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

export function extractEmailFromMessage(message: GmailMessage): string | null {
  const headers = message.payload?.headers || [];
  const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
  if (!fromHeader) return null;
  
  // Extract email from "Name <email@domain.com>" format
  const emailMatch = fromHeader.value.match(/<(.+?)>/);
  return emailMatch ? emailMatch[1] : fromHeader.value;
}

export function extractSubjectFromMessage(message: GmailMessage): string | null {
  const headers = message.payload?.headers || [];
  const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
  return subjectHeader?.value || null;
}

export function decodeMessageBody(message: GmailMessage): string {
  if (message.payload?.body?.data) {
    return atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }
  
  if (message.payload?.parts) {
    for (const part of message.payload.parts) {
      if (part.body?.data) {
        return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }
  }
  
  return '';
} 