# Auth Data Migration Strategy

This document outlines the strategy for migrating authentication data from your local Supabase instance to Supabase Cloud.

## Overview

Auth data migration is one of the most critical and sensitive parts of database migration. Supabase stores authentication data in the `auth` schema, which is separate from your application data in the `public` schema.

## Migration Approaches

### Approach 1: Manual User Recreation (Recommended for Development)

**Best for**: Development/staging environments, small user bases (<50 users)

**Steps**:
1. Export user data from local database
2. Create users manually in Supabase Cloud Dashboard
3. Recreate user profiles and relationships

**Pros**:
- Safest approach
- Easy to verify each user
- No risk of password/security issues

**Cons**:
- Time-consuming for large user bases
- Users need to reset passwords

### Approach 2: Database-Level Import (Advanced)

**Best for**: Production environments, large user bases

**Steps**:
1. Export auth schema data
2. Import using Supabase CLI and direct database access
3. Handle password encryption compatibility

**Pros**:
- Preserves all user data including passwords
- Faster for large datasets

**Cons**:
- More complex and risky
- Requires careful handling of encryption
- May need Supabase support assistance

### Approach 3: Hybrid Approach (Recommended for Production)

**Best for**: Most production scenarios

**Steps**:
1. Export user emails and metadata
2. Use Supabase Admin API to create users
3. Send password reset emails to all users
4. Import application data after users are created

**Pros**:
- Balances security and convenience
- Preserves user metadata
- Automated process possible

**Cons**:
- Users need to reset passwords
- Requires API integration

## Implementation Guide

### Step 1: Export User Data

Run the data export script to extract user information:

```powershell
./scripts/export-database-data.ps1
```

This creates:
- `auth_users.csv` - User data export
- Individual table exports for application data

### Step 2: Prepare Cloud Environment

1. Create your Supabase Cloud project
2. Apply the database schema migration:
   ```sql
   -- Run the complete migration file in Supabase SQL Editor
   -- File: supabase/migrations/20241210000000_complete_database_migration.sql
   ```

### Step 3: Choose Migration Method

#### Method A: Manual Recreation (Simple)

1. Open Supabase Cloud Dashboard
2. Go to Authentication > Users
3. For each user in `auth_users.csv`:
   - Click "Invite user"
   - Enter email address
   - Set temporary password
   - Send invitation

#### Method B: API-Based Import (Automated)

Use the auth migration script:

```powershell
./scripts/migrate-auth-users.ps1 -ProjectUrl "https://your-project.supabase.co" -ServiceKey "your-service-key"
```

#### Method C: CLI-Based Import (Advanced)

1. Install Supabase CLI
2. Link to your cloud project
3. Use direct database import with auth schema

### Step 4: Import Application Data

After users are created:

1. Fix data compatibility issues:
   ```powershell
   ./scripts/fix-data-compatibility.ps1
   ```

2. Import application data using the fixed files
3. Verify all relationships are intact

## Security Considerations

### Password Handling

- **Never** export plaintext passwords
- Local encrypted passwords may not be compatible with cloud
- Always force password resets for security

### User IDs

- **Critical**: Preserve user UUIDs during migration
- Application data references users by ID
- UUID mismatches will break foreign key relationships

### Metadata Preservation

- Export and import user metadata (`raw_user_meta_data`)
- Preserve app metadata (`raw_app_meta_data`)
- Maintain email confirmation status when possible

## Verification Steps

After migration, verify:

1. **User Count**: Cloud matches local user count
2. **User Profiles**: All user_profiles records are linked correctly
3. **Application Data**: All client assignments work
4. **Authentication**: Test login with recreated users
5. **Relationships**: Verify foreign key relationships are intact

## Common Issues and Solutions

### Issue: UUID Mismatch
**Solution**: Ensure user IDs are preserved exactly from local to cloud

### Issue: Missing User Profiles
**Solution**: Re-run user_profiles import after auth users are created

### Issue: Email Conflicts
**Solution**: Handle duplicate emails before import, clean up test accounts

### Issue: RLS Policy Failures
**Solution**: Verify auth.uid() returns expected values after migration

## Rollback Plan

If migration fails:

1. **Schema Rollback**: Delete and recreate cloud project
2. **Data Backup**: Keep local database running until verification complete
3. **User Communication**: Notify users of any access issues
4. **Partial Rollback**: Remove problematic users and re-import

## Testing Strategy

### Pre-Migration Testing

1. Test migration on staging environment first
2. Verify all scripts work with sample data
3. Test authentication flow end-to-end

### Post-Migration Testing

1. Test user login with known credentials
2. Verify all application features work
3. Check data integrity with random sampling
4. Performance test with expected load

## Automation Scripts

The following scripts are provided:

- `export-database-data.ps1` - Export all data including auth
- `fix-data-compatibility.ps1` - Fix schema differences  
- `migrate-auth-users.ps1` - Automated user migration
- `verify-migration.ps1` - Post-migration verification

## Support Resources

- [Supabase Auth Migration Guide](https://supabase.com/docs/guides/migrations)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Database Migration Best Practices](https://supabase.com/docs/guides/database)

## Timeline Estimate

- **Small Project** (<10 users): 2-4 hours
- **Medium Project** (10-100 users): 4-8 hours  
- **Large Project** (100+ users): 1-2 days

Include time for testing, verification, and potential rollback scenarios.

---

**Important**: Always test the migration process on a staging environment before applying to production. Keep backups of your local database until the migration is fully verified. 