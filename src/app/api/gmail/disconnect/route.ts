import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GmailWatchService } from '@/lib/gmail-watch';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { gmailIntegrationId } = await request.json();
    
    if (!gmailIntegrationId) {
      return NextResponse.json({ error: 'gmailIntegrationId is required' }, { status: 400 });
    }

    console.log(`Disconnecting Gmail integration: ${gmailIntegrationId}`);

    // Step 1: Stop the Gmail watch
    const watchService = new GmailWatchService();
    await watchService.stopWatchForIntegration(gmailIntegrationId);

    // Step 2: Delete related records (in transaction)
    const { error: deleteError } = await supabase.rpc('disconnect_gmail_integration', {
      integration_id: gmailIntegrationId
    });

    if (deleteError) {
      console.error('Error deleting Gmail integration:', deleteError);
      return NextResponse.json({ error: 'Failed to disconnect Gmail integration' }, { status: 500 });
    }

    console.log(`Successfully disconnected Gmail integration: ${gmailIntegrationId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Gmail integration disconnected successfully' 
    });

  } catch (error) {
    console.error('Gmail disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 