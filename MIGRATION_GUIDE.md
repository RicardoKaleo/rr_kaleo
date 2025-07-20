# Complete Database Migration Guide

This guide provides step-by-step instructions for migrating your local Supabase database to Supabase Cloud, including both schema and data migration with auth preservation.

## 🎯 Migration Overview

**What will be migrated:**
- Complete database schema (tables, indexes, RLS policies, triggers)
- All application data (clients, job listings, recruiters, etc.)
- User authentication data (with password reset requirement)
- User profiles and relationships

**Estimated time:** 2-6 hours depending on data volume and complexity

## 📋 Prerequisites

Before starting the migration:

1. **Local Environment**
   - Local Supabase instance running
   - PostgreSQL client tools installed (`pg_dump`, `psql`)
   - PowerShell or compatible shell

2. **Cloud Environment**
   - Supabase Cloud account created
   - New Supabase project created (don't run any migrations yet)
   - Project URL and Service Role Key available

3. **Backup Strategy**
   - Keep local database running until verification complete
   - Document current user credentials for testing
   - Take note of sensitive data that should not be migrated (access tokens, etc.)

## 🚀 Migration Steps

### Step 1: Prepare Migration Environment

1. **Navigate to your project directory:**
   ```bash
   cd /path/to/your/Cursor_RR_Site
   ```

2. **Ensure local Supabase is running:**
   ```bash
   supabase start
   ```

3. **Verify all scripts are executable:**
   ```bash
   # If needed, make scripts executable (Linux/Mac)
   chmod +x scripts/*.ps1
   ```

### Step 2: Export Database Schema and Data

1. **Export all table data:**
   ```powershell
   ./scripts/export-database-data.ps1
   ```
   This creates:
   - `migration_data/` directory with individual table exports
   - `migration_data/auth_users.csv` with user data
   - `migration_data/import_data.sql` template

2. **Fix data compatibility issues:**
   ```powershell
   ./scripts/fix-data-compatibility.ps1
   ```
   This creates:
   - `migration_data_fixed/` with corrected data
   - Fixed clients table schema (first_name/last_name)
   - Transformation scripts for existing data

### Step 3: Prepare Cloud Database

1. **Open your Supabase Cloud project dashboard**

2. **Go to SQL Editor and run the complete migration:**
   - Copy content from `supabase/migrations/20241210000000_complete_database_migration.sql`
   - Paste into SQL Editor
   - Click "Run" to create all tables, policies, and triggers

3. **Verify schema creation:**
   ```sql
   -- Run this in SQL Editor to verify tables were created
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

### Step 4: Migrate Authentication Data

Choose one of the following approaches:

#### Option A: Manual User Creation (Recommended for <20 users)

1. **Open Supabase Dashboard → Authentication → Users**
2. **For each user in `migration_data/auth_users.csv`:**
   - Click "Invite user"
   - Enter email address
   - Use temporary password (document it!)
   - Send invitation email

#### Option B: Automated Migration (Recommended for >20 users)

1. **Get your project credentials:**
   - Project URL: `https://your-project-ref.supabase.co`
   - Service Role Key: Found in Settings → API

2. **Run the auth migration script:**
   ```powershell
   ./scripts/migrate-auth-users.ps1 -ProjectUrl "https://your-project.supabase.co" -ServiceKey "your-service-role-key" -DryRun $true
   ```

3. **Review dry run results, then run for real:**
   ```powershell
   ./scripts/migrate-auth-users.ps1 -ProjectUrl "https://your-project.supabase.co" -ServiceKey "your-service-role-key"
   ```

### Step 5: Import Application Data

1. **Import data in dependency order:**

   **First, import user profiles:**
   ```sql
   -- In Supabase SQL Editor, copy content from:
   -- migration_data_fixed/user_profiles.sql
   ```

   **Then import core entities:**
   ```sql
   -- Copy and run each file in order:
   -- 1. migration_data_fixed/clients.sql
   -- 2. migration_data_fixed/client_managers.sql  
   -- 3. migration_data_fixed/client_final_users.sql
   -- 4. migration_data_fixed/clients_meta.sql
   -- 5. migration_data_fixed/recruiters.sql
   -- 6. migration_data_fixed/job_listings.sql
   -- 7. migration_data_fixed/job_recruiters.sql
   ```

   **Finally import remaining data:**
   ```sql
   -- 8. migration_data_fixed/email_templates.sql
   -- 9. migration_data_fixed/email_campaigns.sql
   -- (continue with remaining files)
   ```

2. **Verify data import:**
   ```sql
   -- Check row counts match expectations
   SELECT 'user_profiles' as table_name, count(*) as row_count FROM user_profiles
   UNION ALL
   SELECT 'clients', count(*) FROM clients
   UNION ALL  
   SELECT 'job_listings', count(*) FROM job_listings
   UNION ALL
   SELECT 'recruiters', count(*) FROM recruiters;
   ```

### Step 6: Update Application Configuration

1. **Update environment variables:**
   ```bash
   # Update your .env.local or equivalent
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Update Supabase client configuration:**
   - Check `src/lib/supabase/client.ts`
   - Ensure it points to your cloud instance

3. **Test application connectivity:**
   ```bash
   npm run dev
   # Verify the app connects to cloud database
   ```

### Step 7: Verification and Testing

1. **Authentication Testing:**
   ```sql
   -- Verify auth.uid() works properly
   SELECT auth.uid();
   
   -- Check user_profiles are linked
   SELECT COUNT(*) FROM user_profiles WHERE id = auth.uid();
   ```

2. **Data Integrity Testing:**
   ```sql
   -- Check foreign key relationships
   SELECT 
     c.first_name, c.last_name, c.email,
     COUNT(jl.id) as job_count
   FROM clients c
   LEFT JOIN job_listings jl ON jl.client_id = c.id
   GROUP BY c.id, c.first_name, c.last_name, c.email
   ORDER BY c.first_name;
   ```

3. **Application Functionality Testing:**
   - Test user login with migrated accounts
   - Verify client data displays correctly
   - Test job listing operations
   - Check email campaign functionality
   - Verify RLS policies work as expected

### Step 8: Post-Migration Cleanup

1. **Send password reset emails to all users:**
   ```powershell
   ./scripts/migrate-auth-users.ps1 -ProjectUrl "https://your-project.supabase.co" -ServiceKey "your-service-role-key" -SendInviteEmails $true
   ```

2. **Clean up sensitive data:**
   - Review and regenerate any API keys
   - Update OAuth credentials if needed
   - Remove temporary files with credentials

3. **Update documentation:**
   - Document new database connection details
   - Update any hardcoded URLs in your codebase
   - Update deployment scripts

## 🔧 Troubleshooting Common Issues

### Issue: "Table does not exist" errors
**Solution:** Ensure the complete migration file was run successfully in Step 3

### Issue: Foreign key constraint violations
**Solution:** Import data in the correct dependency order (users → clients → job_listings → etc.)

### Issue: RLS policy failures  
**Solution:** Verify auth.uid() returns expected values after user migration

### Issue: Auth token mismatches
**Solution:** Clear browser storage and re-authenticate with migrated users

### Issue: Missing user_profiles
**Solution:** Re-run user_profiles import after confirming auth users exist

## 📊 Migration Verification Checklist

- [ ] All tables created with correct schema
- [ ] All indexes and triggers in place
- [ ] RLS policies enabled and working
- [ ] Auth users migrated successfully
- [ ] User profiles linked correctly
- [ ] Client data imported completely
- [ ] Job listings associated properly
- [ ] Email templates available
- [ ] Application connects to cloud DB
- [ ] User authentication works
- [ ] Data relationships intact
- [ ] Performance acceptable

## 🚨 Rollback Procedure

If migration fails and you need to rollback:

1. **Keep local database running** - Don't shut it down until cloud migration is verified
2. **Revert environment variables** to point back to local instance
3. **Document any issues** encountered for retry attempt
4. **Contact Supabase support** if you encounter platform-specific issues

## 📞 Support Resources

- **Migration Scripts Issues:** Check script output and error messages
- **Supabase-Specific Issues:** [Supabase Support](https://supabase.com/support)
- **Database Issues:** [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- **Auth Migration:** [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

## 🎉 Success Criteria

Your migration is successful when:

1. ✅ All application functionality works with cloud database
2. ✅ Users can authenticate and access their data
3. ✅ Performance is acceptable for your use case
4. ✅ No data integrity issues detected
5. ✅ All team members can access the new environment

---

**Estimated Timeline:**
- **Preparation:** 30 minutes
- **Schema Migration:** 15 minutes  
- **Data Export:** 30-60 minutes
- **Auth Migration:** 30-90 minutes
- **Data Import:** 60-120 minutes
- **Testing & Verification:** 60-120 minutes
- **Cleanup:** 30 minutes

**Total: 3.5-7 hours** depending on data volume and complexity.

Remember to test thoroughly and keep your local environment running until you're completely satisfied with the cloud migration! 