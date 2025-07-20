import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GmailWatchService } from '@/lib/gmail-watch';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    // For now, let's allow the request to proceed without strict auth check
    // In production, you'd want to validate the session properly
    // const { data: { session } } = await supabase.auth.getSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Fetch Gmail integrations
    const { data: integrations, error: integrationsError } = await supabase
      .from('gmail_integrations')
      .select(`
        id,
        email_address,
        is_active,
        created_at,
        client:clients!inner(
          first_name,
          last_name
        )
      `)
      .eq('is_active', true);

    if (integrationsError) {
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    // Fetch Gmail watches
    const { data: watches, error: watchesError } = await supabase
      .from('gmail_watch_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (watchesError) {
      return NextResponse.json({ error: 'Failed to fetch watches' }, { status: 500 });
    }

    return NextResponse.json({
      integrations: integrations || [],
      watches: watches || [],
    });
  } catch (error) {
    console.error('Error in GET /api/gmail/watch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, let's allow the request to proceed without strict auth check
    // In production, you'd want to validate the session properly
    // const { data: { session } } = await supabase.auth.getSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { integrationId } = await request.json();
    
    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
    }

    const watchService = new GmailWatchService();
    const success = await watchService.setupWatchForIntegration(integrationId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to set up watch' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/gmail/watch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // For now, let's allow the request to proceed without strict auth check
    // In production, you'd want to validate the session properly
    // const { data: { session } } = await supabase.auth.getSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const watchService = new GmailWatchService();
    await watchService.refreshAllWatches();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/gmail/watch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 