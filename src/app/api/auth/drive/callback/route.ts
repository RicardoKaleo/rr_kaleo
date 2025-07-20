import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export async function GET(request: NextRequest) {
  console.log('Google Drive OAuth callback received');
  
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
          try {
            cookieStore.set(name, value, { ...options });
          } catch (err) {
            console.error('Error setting cookie:', err);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete(name);
          } catch (err) {
            console.error('Error removing cookie:', err);
          }
        },
      },
    }
  );

  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No user session found');
    return NextResponse.redirect(new URL('/auth/login?error=No+session+found', request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Get stored state token
  const storedStateToken = cookieStore.get('drive_oauth_state')?.value;

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/dashboard?oauth_error=' + encodeURIComponent(error), request.url));
  }

  if (!code || !state || !storedStateToken) {
    console.error('Missing required OAuth parameters');
    return NextResponse.redirect(new URL('/dashboard?oauth_error=Missing+OAuth+parameters', request.url));
  }

  try {
    // Decode and verify state
    const statePayload = JSON.parse(Buffer.from(state, 'base64url').toString());
    const returnUrl = statePayload.r || '/dashboard';

    if (statePayload.t !== storedStateToken) {
      console.error('State token mismatch');
      return NextResponse.redirect(new URL(returnUrl + '?oauth_error=Invalid+state+token', request.url));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/api/auth/drive/callback',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(new URL(returnUrl + '?oauth_error=Token+exchange+failed', request.url));
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info');
      return NextResponse.redirect(new URL(returnUrl + '?oauth_error=Failed+to+get+user+info', request.url));
    }

    const userInfo = await userInfoResponse.json();

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Create or update Google Drive integration
    const { error: upsertError } = await supabase
      .from('google_drive_integrations')
      .upsert({
        user_id: session.user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        email_address: userInfo.email,
        folder_id: process.env.GOOGLE_DRIVE_FOLDER_ID,
        is_active: true,
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Failed to save Drive integration:', upsertError);
      return NextResponse.redirect(new URL(returnUrl + '?oauth_error=Failed+to+save+integration', request.url));
    }

    // Clear the state cookie
    const response = NextResponse.redirect(new URL(returnUrl + '?oauth_success=Drive+integration+connected', request.url));
    response.cookies.delete('drive_oauth_state');
    
    console.log('Google Drive integration successful for user:', session.user.id);
    return response;

  } catch (error) {
    console.error('Error in Drive OAuth callback:', error);
    return NextResponse.redirect(new URL('/dashboard?oauth_error=Callback+error', request.url));
  }
} 