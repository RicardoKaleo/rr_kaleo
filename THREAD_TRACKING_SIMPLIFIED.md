# Simplified Email Thread Tracking

## Overview

The simplified thread tracking system captures Gmail thread IDs directly in the `email_campaigns` table, eliminating the need for a separate `email_recipients` table. This approach is more suitable for the current use case where each campaign sends one email to one recruiter.

## Database Schema

### email_campaigns Table (Enhanced)
```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  gmail_integration_id UUID REFERENCES gmail_integrations(id),
  template_id UUID REFERENCES email_templates(id),
  custom_subject TEXT,
  custom_body TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  resume_file_url TEXT,
  thread_id TEXT,                    -- Gmail thread ID for tracking
  replied_at TIMESTAMP WITH TIME ZONE, -- When recipient replied
  reply_status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'replied'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Key Features

### 1. Thread ID Capture
- **When**: During email sending via Gmail API
- **Storage**: `thread_id` field in `email_campaigns` table
- **Usage**: Enables conversation continuity for follow-ups

### 2. Reply Status Tracking
- **Status Values**: `pending`, `sent`, `replied`
- **Timestamps**: `sent_at`, `replied_at` for timing analysis
- **Automation**: Foundation for follow-up management

### 3. Simplified Architecture
- **One Table**: All campaign data in `email_campaigns`
- **Direct Relationship**: `job_listing` → `email_campaign`
- **Easier Queries**: No complex joins needed

## API Endpoints

### Email Sending (with Thread ID Capture)
```typescript
POST /api/email/send
{
  "jobListingId": "uuid",
  "customSubject": "Job Application",
  "customBody": "Hello...",
  // ... other fields
}

Response:
{
  "success": true,
  "messageId": "gmail-message-id",
  "threadId": "gmail-thread-id",
  "campaignId": "campaign-uuid",
  "driveFileUrl": "https://..."
}
```

## Gmail API Functions

### sendGmailMessage (Updated)
```typescript
// Now returns both messageId and threadId
const result = await sendGmailMessage(
  integrationId,
  to,
  subject,
  body,
  threadId? // Optional: for follow-ups
);

// Returns: { messageId: string, threadId: string }
```

### Thread ID Usage
```typescript
// Thread ID is captured during email sending
const result = await sendGmailMessage(integrationId, to, subject, body);
// result.threadId contains the Gmail thread ID

// Use thread ID for follow-up emails (maintains conversation context)
const followUpResult = await sendGmailMessage(
  integrationId, 
  to, 
  followUpSubject, 
  followUpBody, 
  result.threadId // Pass existing thread ID
);
```

## Implementation Flow

### 1. Email Sending
1. Send email via Gmail API
2. Capture `threadId` from response
3. Create `email_campaigns` record with `thread_id` and `reply_status: 'sent'`

### 2. Reply Tracking (Future - Google Push/Pull Notifications)
1. Google will notify via webhooks when new messages arrive
2. Use stored `thread_id` to identify relevant campaigns
3. Update `reply_status` to `'replied'` with timestamp
4. Trigger follow-up automation or notifications

### 3. Follow-up Management
1. Check campaigns without replies (`reply_status: 'sent'`)
2. Schedule follow-up emails using same `thread_id`
3. Maintain conversation context

## Benefits

### 1. Simplicity
- **Single Table**: All campaign data in one place
- **Direct Queries**: No complex joins or relationships
- **Easier Maintenance**: Less code to maintain

### 2. Performance
- **Fewer Joins**: Simpler database queries
- **Better Indexing**: Optimized for single-table operations
- **Reduced Overhead**: Less database complexity

### 3. Scalability
- **Future-Proof**: Can add `email_recipients` later if needed
- **Flexible**: Easy to extend with additional fields
- **Maintainable**: Clear, simple architecture

## Usage Examples

### Send Email with Thread Tracking
```typescript
// Email sending automatically captures thread_id
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobListingId: 'uuid',
    customSubject: 'Job Application',
    customBody: 'Hello...',
    // ... other fields
  })
});

const { threadId, campaignId } = await response.json();
```

### Thread ID for Follow-ups
```typescript
// Thread ID is automatically captured and stored
// Use it for follow-up emails to maintain conversation context
const followUpResult = await sendGmailMessage(
  integrationId,
  recipientEmail,
  followUpSubject,
  followUpBody,
  threadId // From email_campaigns.thread_id
);
```

### Send Follow-up
```typescript
// Send follow-up using existing thread
const result = await sendGmailMessage(
  integrationId,
  recipientEmail,
  followUpSubject,
  followUpBody,
  threadId // Use existing thread ID for conversation continuity
);
```

## Database Queries

### Get Campaigns Without Replies
```sql
SELECT * FROM email_campaigns 
WHERE reply_status = 'sent' 
AND thread_id IS NOT NULL;
```

### Get Reply Statistics
```sql
SELECT 
  COUNT(*) as total_campaigns,
  COUNT(CASE WHEN reply_status = 'replied' THEN 1 END) as replied_count,
  AVG(EXTRACT(EPOCH FROM (replied_at - sent_at))/3600) as avg_reply_hours
FROM email_campaigns 
WHERE sent_at IS NOT NULL;
```

### Get Campaign with Thread Info
```sql
SELECT 
  ec.*,
  jl.title as job_title,
  jl.company,
  r.name as recruiter_name,
  r.email as recruiter_email
FROM email_campaigns ec
JOIN job_listings jl ON ec.job_listing_id = jl.id
JOIN job_recruiters jr ON jl.id = jr.job_listing_id
JOIN recruiters r ON jr.recruiter_id = r.id
WHERE ec.id = 'campaign-uuid';
```

## Future Enhancements

### 1. Google Push/Pull Notifications
- **Webhook Integration**: Real-time Gmail push notifications
- **History API**: Pull notifications for message changes
- **Watch API**: Subscribe to mailbox changes

### 2. Follow-up Automation
- **Smart Scheduling**: Send follow-ups only if no reply
- **Thread Continuity**: Maintain conversation context
- **Template Selection**: Choose follow-up templates based on context

### 3. Analytics Dashboard
- **Response Rates**: Track reply percentages by campaign
- **Response Times**: Measure time to reply
- **Campaign Performance**: Overall effectiveness metrics

## Migration Notes

### From email_recipients to email_campaigns
- **Simplified**: Removed unnecessary table complexity
- **Direct**: Thread tracking now in main campaign table
- **Efficient**: Fewer database operations and joins
- **Maintainable**: Easier to understand and debug

This simplified approach provides all the thread tracking benefits while maintaining a clean, efficient architecture that's perfect for the current use case. 