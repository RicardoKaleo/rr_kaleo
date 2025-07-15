# Supabase Cloud Setup Guide

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name:** `reverse-recruiting-saas`
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be ready (usually 2-3 minutes)

### 2. Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

### 3. Configure Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire content from `database-schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

### 5. Test the Connection

1. Start your development server: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. You should see a "Supabase Connection Test" component
4. If it shows "✅ Connected to Supabase successfully!", you're all set!

## 📋 What's Included

The database schema includes:

### Core Tables
- **user_profiles** - Extended user information with roles
- **clients** - Client information and management
- **client_managers** - Manager-client assignments
- **client_final_users** - Final user-client assignments
- **job_listings** - Job posting management
- **recruiters** - Recruiter database
- **job_recruiters** - Job-recruiter associations

### Email System
- **gmail_integrations** - Gmail OAuth connections
- **email_templates** - Reusable email templates
- **email_campaigns** - Campaign management
- **email_recipients** - Campaign recipient tracking

### Security & Logging
- **data_access_logs** - Comprehensive audit trail
- **Row Level Security (RLS)** - Data access policies
- **Indexes** - Performance optimization

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only access data they're authorized to see
- Managers can manage assigned clients
- Final users can only view their assigned client
- All operations are logged for audit purposes

### Authentication Integration
- Integrates with Supabase Auth
- User roles (manager, final_user)
- Secure token management

## 🛠️ Next Steps

After completing this setup:

1. **Test the connection** - Ensure everything is working
2. **Create your first user** - Set up authentication
3. **Add some test data** - Create clients and job listings
4. **Configure Gmail integration** - Set up email campaigns

## 🐛 Troubleshooting

### Connection Issues
- Verify your environment variables are correct
- Check that the Supabase project is active
- Ensure the database schema was executed successfully

### Permission Issues
- Verify RLS policies are in place
- Check user authentication status
- Review the data access logs

### Schema Errors
- Make sure you're running the SQL in the correct order
- Check for any syntax errors in the SQL editor
- Verify all extensions are enabled

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) 