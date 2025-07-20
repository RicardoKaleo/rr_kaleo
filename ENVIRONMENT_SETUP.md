# 🌍 Environment Setup Guide

This guide explains how to manage different environments (local development vs production) for your Reverse Recruiting SaaS application.

## 📁 Environment Files Structure

```
your-project/
├── .env.local          # Local development (gitignored)
├── .env.production     # Production credentials (gitignored)
├── .env.example        # Template for environment variables
└── scripts/
    └── deploy-production.sh  # Deployment automation script
```

## 🔧 Local Development Setup

### 1. Local Environment Variables (`.env.local`)

```bash
# Supabase Configuration (Local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key

# Google OAuth Configuration (Local)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Base URL for local development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Start Local Supabase

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Start local Supabase
supabase start

# This will give you local URLs and keys
```

### 3. Run Local Development

```bash
npm run dev
```

## 🚀 Production Setup

### 1. Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down the project URL and keys

### 2. Production Environment Variables (`.env.production`)

```bash
# Supabase Configuration (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Google OAuth Configuration (Production)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback/google

# Base URL for production
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

### 3. Deploy to Production

Use the automated deployment script:

```bash
# Make the script executable
chmod +x scripts/deploy-production.sh

# Run the deployment script
./scripts/deploy-production.sh
```

Or follow the manual steps in `DEPLOYMENT.md`.

## 🔄 Environment Switching

### Development Workflow

1. **Local Development**:
   ```bash
   # Use local environment
   cp .env.local .env.local.backup  # Backup if needed
   npm run dev
   ```

2. **Testing Production Config**:
   ```bash
   # Temporarily switch to production config
   cp .env.production .env.local
   npm run dev
   # Test with production database
   # Don't commit changes to .env.local
   ```

3. **Revert to Local**:
   ```bash
   # Restore local environment
   cp .env.local.backup .env.local
   ```

## 🔐 Security Best Practices

### 1. Never Commit Sensitive Files

Add to `.gitignore`:
```gitignore
# Environment files
.env.local
.env.production
.env.*.local

# Supabase
.supabase/
```

### 2. Use Different Google OAuth Credentials

- **Development**: Use localhost redirect URIs
- **Production**: Use your production domain redirect URIs

### 3. Database Security

- **Local**: Open for development
- **Production**: Use RLS policies and proper authentication

## 📊 Environment Comparison

| Feature | Local | Production |
|---------|-------|------------|
| Database | Local Supabase | Supabase Cloud |
| URL | localhost:3000 | your-domain.vercel.app |
| Google OAuth | localhost redirect | production redirect |
| Webhooks | ngrok/tunnel | public domain |
| Environment | Development | Production |

## 🛠️ Troubleshooting

### Issue: Environment Variables Not Loading

**Solution**:
```bash
# Check if .env.local exists
ls -la .env.local

# Verify variable names match exactly
cat .env.local

# Restart development server
npm run dev
```

### Issue: Production Database Connection Fails

**Solution**:
1. Verify Supabase URL and keys
2. Check RLS policies
3. Ensure database is accessible from Vercel

### Issue: Google OAuth Not Working in Production

**Solution**:
1. Update redirect URIs in Google Cloud Console
2. Add production domain to authorized origins
3. Verify environment variables in Vercel

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to `main`:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel automatically deploys
```

### Environment Variable Updates

To update environment variables in production:
1. Go to Vercel dashboard
2. Navigate to your project settings
3. Update environment variables
4. Redeploy (automatic or manual)

## 📈 Monitoring

### Local Monitoring
- Check browser console for errors
- Monitor Supabase logs in local dashboard
- Use Next.js development tools

### Production Monitoring
- Vercel analytics and error tracking
- Supabase dashboard monitoring
- Set up alerts for critical errors

## 🎯 Best Practices Summary

1. **Always use environment variables** for configuration
2. **Never commit sensitive data** to Git
3. **Test production config** locally before deploying
4. **Use different credentials** for dev and production
5. **Monitor your production deployment** regularly
6. **Keep local and production schemas** in sync
7. **Use the deployment script** for consistent deployments

## 📞 Support

- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Google OAuth**: [developers.google.com/identity](https://developers.google.com/identity)

Your application is now ready for both local development and production deployment! 🎉 