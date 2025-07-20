# 🚀 Deployment Guide - Vercel

This guide will walk you through deploying your Reverse Recruiting SaaS application to Vercel.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Environment Variables**: Prepare all your environment variables

## 🔧 Step 1: Prepare Environment Variables

Create a `.env.local` file in your project root with all required variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback/google

# Base URL for production
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

## 🌐 Step 2: Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add your production redirect URI:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```

## 📦 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `.next` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

4. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add all variables from your `.env.local` file
   - Make sure to add them for **Production**, **Preview**, and **Development**

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set up environment variables
   - Deploy

## 🔒 Step 4: Configure Custom Domain (Optional)

1. In your Vercel dashboard, go to your project
2. Click "Settings" > "Domains"
3. Add your custom domain
4. Update your DNS records as instructed

## ⚙️ Step 5: Update Google OAuth for Custom Domain

If using a custom domain, update your Google OAuth redirect URI:
```
https://your-custom-domain.com/api/auth/callback/google
```

## 🔄 Step 6: Set Up Automatic Deployments

Vercel automatically:
- Deploys on every push to `main` branch
- Creates preview deployments for pull requests
- Handles rollbacks if needed

## 🧪 Step 7: Test Your Deployment

1. **Test Authentication**:
   - Try logging in/registering
   - Verify Supabase connection

2. **Test Gmail Integration**:
   - Connect Gmail OAuth
   - Test email sending
   - Verify webhook endpoints

3. **Test Database Operations**:
   - Create/read/update clients
   - Test job listings
   - Verify email campaigns

## 🚨 Common Issues & Solutions

### Issue: Build Fails
**Solution**: Check build logs in Vercel dashboard for specific errors

### Issue: Environment Variables Not Working
**Solution**: 
- Verify all variables are added to Vercel
- Check variable names match exactly
- Ensure no extra spaces or quotes

### Issue: Google OAuth Not Working
**Solution**:
- Verify redirect URI matches exactly
- Check Google Cloud Console settings
- Ensure domain is added to authorized origins

### Issue: Supabase Connection Fails
**Solution**:
- Verify Supabase URL and keys
- Check RLS policies
- Ensure database is accessible from Vercel

## 📊 Monitoring & Analytics

1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Monitor build and runtime errors
3. **Performance**: Check Core Web Vitals in Vercel dashboard

## 🔄 Updating Your Deployment

To update your deployed application:

```bash
# Make your changes
git add .
git commit -m "Update description"
git push origin main

# Vercel automatically deploys the new version
```

## 🛡️ Security Considerations

1. **Environment Variables**: Never commit `.env.local` to Git
2. **API Keys**: Rotate keys regularly
3. **CORS**: Configure properly for your domain
4. **Rate Limiting**: Consider adding rate limiting for API routes

## 📞 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Environment variables configured in Vercel
- [ ] Google OAuth redirect URIs updated
- [ ] Custom domain configured (if needed)
- [ ] Authentication tested
- [ ] Gmail integration tested
- [ ] Database operations tested
- [ ] Error monitoring set up

Your application should now be live and accessible at your Vercel URL! 🎉 