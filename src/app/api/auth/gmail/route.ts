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
  console.log('Starting Gmail OAuth flow...');
  
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
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Get client ID from query params
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId');
  console.log('Received clientId from query:', clientId);
  
  if (!clientId) {
    console.error('No clientId in query parameters');
    return new NextResponse('Client ID is required', { status: 400 });
  }

  try {
    // Generate state token to prevent CSRF
    const state = Math.random().toString(36).substring(7);

    // Create response with OAuth URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: GMAIL_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    const response = NextResponse.json({ 
      url: `${GOOGLE_OAUTH_URL}?${params.toString()}` 
    });

    // Set cookies in the response
    response.cookies.set('gmail_client_id', clientId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
      path: '/',
    });

    response.cookies.set('gmail_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
      path: '/',
    });

    console.log('Set cookies in response:', {
      clientId,
      state,
    });

    return response;
  } catch (error) {
    console.error('Error in Gmail OAuth setup:', error);
    return new NextResponse('Failed to setup Gmail integration', { status: 500 });
  }
} 