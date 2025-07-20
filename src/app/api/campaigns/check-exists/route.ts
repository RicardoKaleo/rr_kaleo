import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobListingId = searchParams.get('jobListingId');

    if (!jobListingId) {
      return NextResponse.json(
        { error: 'jobListingId parameter is required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Use a direct SQL query to check for campaign existence
    // This bypasses potential RLS issues by using a simple COUNT query
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('job_listing_id', jobListingId)
      .limit(1);

    if (error) {
      console.error('Error checking campaign existence:', error);
      return NextResponse.json(
        { error: 'Failed to check campaign existence' },
        { status: 500 }
      );
    }

    const exists = data && data.length > 0;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error in check-campaign-exists:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 