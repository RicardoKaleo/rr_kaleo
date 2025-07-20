import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID!;
const REDIRECT_URI = 'http://localhost:3000/api/auth/drive/callback';

// Define all required Google Drive scopes
const DRIVE_SCOPES = [
  // Full access to Google Drive (needed to access existing folders)
  'https://www.googleapis.com/auth/drive',
  // Access to Shared Drives (needed for Workspace Shared Drives)
  'https://www.googleapis.com/auth/drive.file',
  // Basic profile info (email address)
  'https://www.googleapis.com/auth/userinfo.email',
];

export async function GET(request: Request) {
  console.log('Starting Google Drive OAuth connect flow...');
  
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

  // Get return URL from query params
  const url = new URL(request.url);
  const returnUrl = url.searchParams.get('returnUrl') || '/dashboard';
  
  console.log('Request parameters:', { returnUrl });
  
  try {
    // Use the registered redirect URI from environment or construct it consistently
    const redirectUri = REDIRECT_URI;

    // Generate CSRF token
    const stateToken = crypto.randomUUID();

    // Encode state as JSON then base64
    const statePayload = {
      t: stateToken,
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
          scope: DRIVE_SCOPES.join(' '),
          access_type: 'offline',
          prompt: 'consent',
          state: encodedState,
        })}`,
      },
    });

    // Store CSRF token in cookie
    response.cookies.set('drive_oauth_state', stateToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      path: '/',
    });

    console.log('OAuth setup', { redirectUri, statePayload });

    console.log('Redirecting to Google Drive OAuth...');
    return response;
  } catch (error) {
    console.error('Error in Google Drive OAuth setup:', error);
    return NextResponse.redirect(returnUrl + '?oauth_error=Failed+to+setup+Drive+integration');
  }
} 