# Google Drive Integration Setup

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Google Drive OAuth Configuration (separate from Gmail)
GOOGLE_DRIVE_CLIENT_ID=455499533059-ln7kq04ivd7n8u8lm8s74kp48tm4jgo7.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=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
GOOGLE_DRIVE_FOLDER_ID=0AHFedUByur1pUk9PVA

# Gmail OAuth Configuration (separate from Drive)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_gmail_client_id
GOOGLE_CLIENT_SECRET=your_gmail_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/gmail/oauth/callback
```

## Google Cloud Console Configuration

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"

### 2. Configure OAuth Consent Screen

1. Go to "OAuth consent screen"
2. Set up the consent screen with your app name and user support email
3. Add the following scopes:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`

### 3. Configure OAuth 2.0 Client ID

1. Application type: "Web application"
2. Name: "Reverse Recruiting Drive Integration"
3. **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/drive/callback` (for development)
   - `https://your-production-domain.com/api/auth/drive/callback` (for production)

### 4. Enable Required APIs

1. Go to "APIs & Services" > "Library"
2. Enable the following APIs:
   - Google Drive API
   - Gmail API (if not already enabled)

## Testing the Integration

1. Start your development server: `npm run dev`
2. Navigate to the dashboard
3. Click "Connect Google Drive"
4. Complete the OAuth flow
5. The integration should now work with automatic token refresh

## Troubleshooting

### URI Mismatch Error

If you get a `uri_mismatch` error:

1. **Check your environment variables**: Make sure `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET` are set correctly
2. **Verify Google Console**: Ensure the redirect URI `http://localhost:3000/api/auth/drive/callback` is listed in your Drive OAuth 2.0 client's authorized redirect URIs
3. **Clear browser cache**: Sometimes cached OAuth state can cause issues
4. **Check for typos**: The redirect URI must match exactly, including protocol (http/https) and port

### Token Refresh Issues

If token refresh fails:

1. Check that the refresh token is stored correctly in the database
2. Verify that the Google Client ID and Secret are correct
3. Ensure the OAuth consent screen includes the necessary scopes
4. Check the server logs for detailed error messages

## Production Deployment

For production, update your environment variables:

```bash
GOOGLE_DRIVE_CLIENT_ID=your_production_drive_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_production_drive_client_secret
GOOGLE_DRIVE_FOLDER_ID=your_production_folder_id
```

And add the production redirect URI `https://your-domain.com/api/auth/drive/callback` to your Google Cloud Console OAuth 2.0 client configuration. 