import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function cleanReplyContent(content: string): string {
  try {
    if (!content) return '';
    
    // Remove all newlines and extra spaces first
    let cleaned = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Split by common email thread markers and take the first part
    const threadMarkers = [
      'On ',
      'From:',
      'Sent:',
      'To:',
      'Subject:',
      'wrote:',
      '<',
      '@'
    ];
    
    let shortestIndex = cleaned.length;
    for (const marker of threadMarkers) {
      const index = cleaned.indexOf(marker);
      if (index > 0 && index < shortestIndex) {
        shortestIndex = index;
      }
    }
    
    if (shortestIndex < cleaned.length) {
      cleaned = cleaned.substring(0, shortestIndex).trim();
    }
    
    // If still too long, take just the first sentence or first 100 characters
    if (cleaned.length > 100) {
      const firstSentence = cleaned.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 200) {
        cleaned = firstSentence.trim() + (cleaned.includes('.') || cleaned.includes('!') || cleaned.includes('?') ? '.' : '');
      } else {
        cleaned = cleaned.substring(0, 100) + '...';
      }
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error cleaning reply content:', error);
    return content;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get all campaigns with reply content
    const { data: campaigns, error: fetchError } = await supabase
      .from('email_campaigns')
      .select('id, reply_content')
      .not('reply_content', 'is', null)
      .not('reply_content', 'eq', '');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    let updatedCount = 0;
    const updates = [];

    for (const campaign of campaigns || []) {
      if (campaign.reply_content) {
        const cleanedContent = cleanReplyContent(campaign.reply_content);
        
        // Only update if the content actually changed
        if (cleanedContent !== campaign.reply_content) {
          updates.push({
            id: campaign.id,
            reply_content: cleanedContent
          });
        }
      }
    }

    // Update campaigns in batches
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('email_campaigns')
        .update({ reply_content: update.reply_content })
        .eq('id', update.id);

      if (!updateError) {
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalCampaigns: campaigns?.length || 0,
      updatedCount,
      message: `Successfully cleaned ${updatedCount} reply messages`
    });

  } catch (error) {
    console.error('Error cleaning replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 