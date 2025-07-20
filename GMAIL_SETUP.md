# Gmail OAuth 2.0 Integration Setup

This guide will help you set up Gmail OAuth 2.0 integration for the Reverse Recruiting SaaS platform.

## Prerequisites

1. A Google Cloud Console account
2. A Gmail account for testing
3. Access to your application's environment variables

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click on it and press "Enable"

### 1.2 Configure OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Configure the following settings:

#### Authorized JavaScript origins:
```
http://localhost:3001
http://localhost:3000
https://your-production-domain.com
```

#### Authorized redirect URIs:
```
http://localhost:3001/gmail/oauth/callback
http://localhost:3000/gmail/oauth/callback
https://your-production-domain.com/gmail/oauth/callback
```

5. Click "Create"
6. Note down your **Client ID** and **Client Secret**

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Fill in the required information:
   - App name: "Reverse Recruiting SaaS"
   - User support email: Your email
   - Developer contact information: Your email
4. Add the following scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
5. Add test users (your Gmail address) if in testing mode
6. Save and continue

## Step 2: Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Google OAuth 2.0 Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3001/gmail/oauth/callback
```

For production, update the redirect URI to your production domain:

```bash
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-production-domain.com/gmail/oauth/callback
```

## Step 3: Database Schema

The Gmail integration uses the `gmail_integrations` table that's already defined in your database schema:

```sql
CREATE TABLE gmail_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  email_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 4: Testing the Integration

1. Start your development server
2. Navigate to `/dashboard/gmail-integration`
3. Click "Connect Gmail Account"
4. Complete the OAuth flow
5. Verify the integration shows as "Active"

## Step 5: Security Considerations

### Token Storage
- Access tokens and refresh tokens are stored in the database
- Consider encrypting sensitive tokens in production
- Implement proper RLS policies for the `gmail_integrations` table

### Token Refresh
- Access tokens expire after 1 hour
- The system automatically refreshes tokens when needed
- Refresh tokens don't expire unless revoked by the user

### Permissions
- The integration only requests Gmail-specific scopes
- Users can revoke access at any time through their Google Account settings
- No access to other Google services

## Step 6: Production Deployment

### Environment Variables
Update your production environment variables with the production redirect URI:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-production-domain.com/gmail/oauth/callback
```

### Google Cloud Console
1. Update the OAuth consent screen to "In production"
2. Add your production domain to authorized origins and redirect URIs
3. Remove test users if any were added

### Security
1. Ensure your production database has proper encryption
2. Implement rate limiting for OAuth endpoints
3. Monitor OAuth usage and errors
4. Set up alerts for failed token refreshes

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Ensure the redirect URI in your environment variables matches exactly what's configured in Google Cloud Console
   - Check for trailing slashes or protocol mismatches

2. **"invalid_client" error**
   - Verify your Client ID and Client Secret are correct
   - Ensure the OAuth consent screen is properly configured

3. **"access_denied" error**
   - Check if the user denied permission during OAuth flow
   - Verify the requested scopes are properly configured

4. **Token refresh failures**
   - Check if the refresh token is still valid
   - Verify the user hasn't revoked access
   - Ensure the Gmail API is enabled

### Debug Mode
Enable debug logging by adding to your environment:

```bash
DEBUG=gmail:*
```

## API Endpoints

The integration creates the following API endpoints:

- `POST /api/gmail/oauth/callback` - Handles OAuth callback
- `POST /api/gmail/refresh-token` - Refreshes access tokens

## Usage in Application

Once configured, users can:

1. Connect their Gmail account through the dashboard
2. Send emails using the Gmail API
3. Track replies and responses
4. Manage email campaigns
5. Automate follow-up sequences

The integration is designed to be secure, user-friendly, and compliant with Google's OAuth 2.0 best practices. 