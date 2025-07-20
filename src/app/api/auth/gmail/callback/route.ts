import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

// Simplified GET handler for Google OAuth redirects
export async function GET(request: Request) {
  console.log('Gmail OAuth callback started...');

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

  // Ensure user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return redirectWithError('Unauthorized', '/dashboard/clients');
  }

  // Extract query params
  const url = new URL(request.url);
  const encodedState = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code');
  const origin = `${url.protocol}//${url.host}`;

  console.log('Callback params:', { encodedState, hasCode: !!code, origin });

  let stateToken = '';
  let clientId = '';
  let returnUrl: string = '/dashboard/clients';

  try {
    const decoded = JSON.parse(Buffer.from(encodedState, 'base64url').toString());
    stateToken = decoded.t;
    clientId   = decoded.c;
    returnUrl  = decoded.r || returnUrl;
    console.log('Decoded state', { stateToken, clientId, returnUrl });
  } catch (err) {
    console.error('State decode failed', err);
    return redirectWithError('Invalid state parameter', returnUrl);
  }

  // CSRF check
  const storedState = cookieStore.get('gmail_oauth_state')?.value;
  if (!storedState || storedState !== stateToken) {
    return redirectWithError('Invalid state parameter', returnUrl);
  }

  if (!code) {
    return redirectWithError('Authorization code missing', returnUrl);
  }

  try {
    // Exchange code for tokens
    const redirectUri = `${origin}/api/auth/gmail/callback`;
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) throw new Error(await tokenRes.text());
    const tokens = await tokenRes.json();

    // Get user info
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) throw new Error(await profileRes.text());
    const profile = await profileRes.json();
    console.log('Successfully fetched user profile:', profile.email);

    // Deactivate existing integrations
    console.log('Deactivating existing integrations for client:', clientId);
    const { error: updateError } = await supabase
      .from('gmail_integrations')
      .update({ is_active: false })
      .eq('client_id', clientId)
      .eq('is_active', true);

    if (updateError) {
      console.error('Supabase error deactivating old integrations:', updateError);
      throw new Error(`Failed to deactivate old integrations: ${updateError.message}`);
    }
    console.log('Successfully deactivated old integrations.');

    // Insert new integration
    console.log('Inserting new integration...');
    const { data: insertData, error: insertError } = await supabase
      .from('gmail_integrations')
      .insert({
        client_id: clientId,
        email_address: profile.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        is_active: true,
      })
      .select(); // Use .select() to get the inserted data back for logging

    if (insertError) {
      console.error('Supabase error inserting new integration:', insertError);
      throw new Error(`Failed to insert new integration: ${insertError.message}`);
    }
    console.log('Successfully inserted new integration:', insertData);

    // Automatically setup Gmail watch for the new integration
    try {
      console.log('Setting up Gmail watch for new integration...');
      const { GmailWatchService } = await import('@/lib/gmail-watch');
      const watchService = new GmailWatchService();
      const watchSuccess = await watchService.setupWatchForIntegration(insertData[0].id);
      
      if (watchSuccess) {
        console.log('Gmail watch setup successful');
      } else {
        console.warn('Gmail watch setup failed - will need manual setup');
      }
    } catch (watchError) {
      console.error('Error setting up Gmail watch:', watchError);
      // Don't fail the entire OAuth flow if watch setup fails
    }

    // Cleanup
    cookieStore.delete('gmail_oauth_state');

    return new NextResponse(null, {
      status: 302,
      headers: { Location: `${returnUrl}?oauth_success=true` },
    });
  } catch (err) {
    console.error('OAuth processing failed', err);
    return redirectWithError('Failed to complete Gmail integration', returnUrl);
  }
}

function redirectWithError(error: string, returnUrl: string) {
  return new NextResponse(null, {
    status: 302,
    headers: { Location: `${returnUrl}?oauth_error=${encodeURIComponent(error)}` },
  });
} 