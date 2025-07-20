import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

// Define all required Gmail scopes
const GMAIL_SCOPES = [
  // Read, send, and manage emails
  'https://mail.google.com/',
  // Basic profile info (email address)
  'https://www.googleapis.com/auth/userinfo.email',
  // Pub/Sub for Gmail watch notifications
  'https://www.googleapis.com/auth/pubsub',
];

export async function GET(request: Request) {
  console.log('Starting Gmail OAuth connect flow...');
  
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get client ID and return URL from query params
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId');
  const returnUrl = url.searchParams.get('returnUrl') || '/dashboard/clients';
  
  console.log('Request parameters:', { clientId, returnUrl });
  
  if (!clientId) {
    console.error('No clientId in query parameters');
    return NextResponse.redirect(returnUrl + '?oauth_error=Client+ID+is+required');
  }

  try {
    // Determine origin dynamically to support any dev port
    const origin = `${url.protocol}//${url.host}`;
    const redirectUri = `${origin}/api/auth/gmail/callback`;

    // Generate CSRF token
    const stateToken = crypto.randomUUID();

    // Encode state as JSON then base64
    const statePayload = {
      t: stateToken,
      c: clientId,
      r: returnUrl,
    };
    const encodedState = Buffer.from(JSON.stringify(statePayload)).toString('base64url'); // url-safe base64

    const response = new NextResponse(null, {
      status: 302,
      headers: {
        'Location': `${GOOGLE_OAUTH_URL}?${new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: GMAIL_SCOPES.join(' '),
          access_type: 'offline',
          prompt: 'consent',
          state: encodedState,
        })}`,
      },
    });

    // Store CSRF token in cookie
    response.cookies.set('gmail_oauth_state', stateToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      path: '/',
    });

    console.log('OAuth setup', { origin, redirectUri, statePayload });

    console.log('Redirecting to Google OAuth...');
    return response;
  } catch (error) {
    console.error('Error in Gmail OAuth setup:', error);
    return NextResponse.redirect(returnUrl + '?oauth_error=Failed+to+setup+Gmail+integration');
  }
} 