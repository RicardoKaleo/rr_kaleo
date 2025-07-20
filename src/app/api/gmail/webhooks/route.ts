import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Webhook received:', new Date().toISOString());
    
    const body = await request.text();
    const signature = request.headers.get('x-goog-signature');
    
    // Log the request for debugging
    console.log('Webhook headers:', Object.fromEntries(request.headers.entries()));
    console.log('Webhook body length:', body.length);
    
    // For development, we'll skip signature verification
    // In production, implement proper signature verification
    if (process.env.NODE_ENV === 'production') {
      if (!verifySignature(body, signature)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    console.log('Webhook data:', JSON.stringify(data, null, 2));
    
    // Handle Pub/Sub message
    if (data.message) {
      const message = JSON.parse(Buffer.from(data.message.data, 'base64').toString());
      console.log('Decoded message:', JSON.stringify(message, null, 2));
      
      // For now, just log the notification
      // Later, you'll implement the GmailReplyProcessor here
      console.log('Gmail notification received:', {
        emailAddress: message.emailAddress,
        historyId: message.historyId,
        timestamp: new Date().toISOString()
      });
      
      // Track Gmail notification
      const { GmailNotificationTracker } = await import('@/lib/gmail-notification-tracker');
      const tracker = new GmailNotificationTracker();
      await tracker.trackNotification(message);
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Gmail webhook endpoint is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

function verifySignature(body: string, signature: string | null): boolean {
  // For Google Pub/Sub, you can verify the message came from Google
  // by checking the 'x-goog-signature' header
  // In production, implement proper signature verification
  return true; // Simplified for development
} 