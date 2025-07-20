# Migration Verification Script
# This script validates that the database migration was successful
# by checking data integrity, relationships, and functionality

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$ServiceKey,
    
    [string]$LocalDataFile = "migration_data/auth_users.csv",
    [bool]$DetailedReport = $true
)

Write-Host "✅ Migration Verification Tool" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to execute SQL query against Supabase
function Invoke-SupabaseQuery {
    param(
        [string]$Query,
        [string]$Description = ""
    )
    
    $headers = @{
        'apikey' = $ServiceKey
        'Authorization' = "Bearer $ServiceKey"
        'Content-Type' = 'application/json'
    }
    
    try {
        $body = @{
            query = $Query
        } | ConvertTo-Json
        
        $uri = "$ProjectUrl/rest/v1/rpc/exec_sql"
        
        # Try direct SQL execution if available, otherwise use table queries
        Write-Status "Executing: $Description"
        
        # This is a simplified approach - in practice you'd use the PostgREST API
        # For now, we'll provide the queries for manual execution
        Write-Host "Query to run manually:" -ForegroundColor Yellow
        Write-Host $Query -ForegroundColor Gray
        Write-Host ""
        
        return @{ success = $true; data = @() }
    }
    catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Validation tests
$validationTests = @()

# Test 1: Schema Validation
function Test-SchemaIntegrity {
    Write-Status "Testing schema integrity..."
    
    $expectedTables = @(
        'user_profiles', 'clients', 'client_managers', 'client_final_users',
        'clients_meta', 'job_listings', 'recruiters', 'job_recruiters',
        'gmail_integrations', 'google_drive_integrations', 'email_templates',
        'email_campaigns', 'email_campaign_followups', 'gmail_watch_subscriptions',
        'gmail_history_tracking', 'data_access_logs'
    )
    
    $schemaQuery = @"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('$(($expectedTables -join "','"))')
ORDER BY table_name;
"@
    
    Write-Host "Manual verification query for schema:" -ForegroundColor Yellow
    Write-Host $schemaQuery -ForegroundColor Gray
    Write-Host "Expected result: $($expectedTables.Count) tables" -ForegroundColor Gray
    Write-Host ""
    
    return @{
        name = "Schema Integrity"
        status = "manual_check"
        description = "Verify all expected tables exist"
        query = $schemaQuery
        expected = "$($expectedTables.Count) tables: $($expectedTables -join ', ')"
    }
}

# Test 2: Data Count Validation
function Test-DataCounts {
    Write-Status "Testing data counts..."
    
    $countQuery = @"
SELECT 'user_profiles' as table_name, count(*) as row_count FROM user_profiles
UNION ALL
SELECT 'clients', count(*) FROM clients
UNION ALL
SELECT 'job_listings', count(*) FROM job_listings
UNION ALL
SELECT 'recruiters', count(*) FROM recruiters
UNION ALL
SELECT 'email_templates', count(*) FROM email_templates
UNION ALL
SELECT 'email_campaigns', count(*) FROM email_campaigns
ORDER BY table_name;
"@
    
    Write-Host "Manual verification query for data counts:" -ForegroundColor Yellow
    Write-Host $countQuery -ForegroundColor Gray
    Write-Host ""
    
    return @{
        name = "Data Count Validation"
        status = "manual_check"
        description = "Verify data was imported correctly"
        query = $countQuery
        expected = "Non-zero counts for all tables with data"
    }
}

# Test 3: Foreign Key Relationships
function Test-Relationships {
    Write-Status "Testing foreign key relationships..."
    
    $relationshipQuery = @"
-- Test client-manager relationships
SELECT 
    'client_managers' as test_table,
    COUNT(*) as total_records,
    COUNT(DISTINCT client_id) as unique_clients,
    COUNT(DISTINCT manager_id) as unique_managers
FROM client_managers

UNION ALL

-- Test job listings relationships
SELECT 
    'job_listings' as test_table,
    COUNT(*) as total_records,
    COUNT(DISTINCT client_id) as unique_clients,
    0 as unique_managers
FROM job_listings

UNION ALL

-- Test user profiles relationships
SELECT 
    'user_profiles' as test_table,
    COUNT(*) as total_records,
    0 as unique_clients,
    0 as unique_managers
FROM user_profiles;
"@
    
    Write-Host "Manual verification query for relationships:" -ForegroundColor Yellow
    Write-Host $relationshipQuery -ForegroundColor Gray
    Write-Host ""
    
    return @{
        name = "Foreign Key Relationships"
        status = "manual_check"
        description = "Verify all foreign key relationships are intact"
        query = $relationshipQuery
        expected = "All counts should be reasonable and non-zero where expected"
    }
}

# Test 4: RLS Policy Validation
function Test-RLSPolicies {
    Write-Status "Testing RLS policies..."
    
    $rlsQuery = @"
-- Check RLS is enabled on key tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'clients', 'job_listings', 'email_templates')
ORDER BY tablename;
"@
    
    $policiesQuery = @"
-- Check policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
"@
    
    Write-Host "Manual verification queries for RLS:" -ForegroundColor Yellow
    Write-Host "1. Check RLS is enabled:" -ForegroundColor Gray
    Write-Host $rlsQuery -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Check policies exist:" -ForegroundColor Gray
    Write-Host $policiesQuery -ForegroundColor Gray
    Write-Host ""
    
    return @{
        name = "RLS Policy Validation"
        status = "manual_check"
        description = "Verify Row Level Security policies are active"
        query = "$rlsQuery`n`n$policiesQuery"
        expected = "RLS enabled on all tables, policies present"
    }
}

# Test 5: Auth Integration
function Test-AuthIntegration {
    Write-Status "Testing auth integration..."
    
    $authQuery = @"
-- Check if auth users exist (run while authenticated)
SELECT 
    COUNT(*) as auth_user_count
FROM auth.users 
WHERE deleted_at IS NULL;
"@
    
    $profileLinkQuery = @"
-- Check user_profiles are linked to auth users
SELECT 
    COUNT(up.id) as profiles_count,
    COUNT(au.id) as auth_users_count
FROM user_profiles up
FULL OUTER JOIN auth.users au ON au.id = up.id
WHERE au.deleted_at IS NULL;
"@
    
    Write-Host "Manual verification queries for auth integration:" -ForegroundColor Yellow
    Write-Host "1. Check auth users exist:" -ForegroundColor Gray
    Write-Host $authQuery -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Check profile linkage:" -ForegroundColor Gray
    Write-Host $profileLinkQuery -ForegroundColor Gray
    Write-Host ""
    
    # Check local file for expected count
    $expectedUserCount = 0
    if (Test-Path $LocalDataFile) {
        $expectedUserCount = (Import-Csv $LocalDataFile).Count
        Write-Host "Expected user count from local export: $expectedUserCount" -ForegroundColor Gray
    }
    
    return @{
        name = "Auth Integration"
        status = "manual_check"
        description = "Verify auth users and profiles are properly linked"
        query = "$authQuery`n`n$profileLinkQuery"
        expected = "Auth user count should match exported users ($expectedUserCount)"
    }
}

# Test 6: Application Data Integrity
function Test-ApplicationData {
    Write-Status "Testing application data integrity..."
    
    $integrityQuery = @"
-- Check client data integrity
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    COUNT(jl.id) as job_listings_count,
    COUNT(cm.id) as manager_assignments,
    COUNT(cfu.id) as final_user_assignments
FROM clients c
LEFT JOIN job_listings jl ON jl.client_id = c.id
LEFT JOIN client_managers cm ON cm.client_id = c.id
LEFT JOIN client_final_users cfu ON cfu.client_id = c.id
GROUP BY c.id, c.first_name, c.last_name, c.email
ORDER BY c.first_name, c.last_name;
"@
    
    Write-Host "Manual verification query for application data:" -ForegroundColor Yellow
    Write-Host $integrityQuery -ForegroundColor Gray
    Write-Host ""
    
    return @{
        name = "Application Data Integrity"
        status = "manual_check"
        description = "Verify client relationships and data consistency"
        query = $integrityQuery
        expected = "All clients should have reasonable relationship counts"
    }
}

# Main execution
Write-Status "Starting migration verification..."
Write-Host "Project URL: $ProjectUrl" -ForegroundColor Gray
Write-Host ""

# Run all validation tests
$validationTests += Test-SchemaIntegrity
$validationTests += Test-DataCounts
$validationTests += Test-Relationships
$validationTests += Test-RLSPolicies
$validationTests += Test-AuthIntegration
$validationTests += Test-ApplicationData

# Generate verification report
Write-Host "🔍 MIGRATION VERIFICATION REPORT" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

foreach ($test in $validationTests) {
    Write-Host "Test: $($test.name)" -ForegroundColor Yellow
    Write-Host "Status: $($test.status)" -ForegroundColor $(if ($test.status -eq "manual_check") { "Blue" } else { "Green" })
    Write-Host "Description: $($test.description)"
    Write-Host "Expected: $($test.expected)"
    
    if ($DetailedReport) {
        Write-Host ""
        Write-Host "Query to execute:" -ForegroundColor Gray
        Write-Host $test.query -ForegroundColor DarkGray
    }
    
    Write-Host ""
    Write-Host "---" -ForegroundColor DarkGray
    Write-Host ""
}

# Create verification SQL file
$verificationFile = "migration_verification_queries.sql"
$sqlContent = @"
-- Migration Verification Queries
-- Run these queries in your Supabase Cloud SQL Editor to verify migration success
-- Generated on $(Get-Date)

"@

foreach ($test in $validationTests) {
    $sqlContent += @"
-- Test: $($test.name)
-- Description: $($test.description)
-- Expected: $($test.expected)

$($test.query)

-- End of $($test.name)
-- ================================================================

"@
}

$sqlContent | Out-File -FilePath $verificationFile -Encoding UTF8
Write-Success "Created verification queries file: $verificationFile"

Write-Host ""
Write-Host "📋 VERIFICATION CHECKLIST" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

$checklist = @(
    "Schema Migration: All tables created successfully",
    "Data Import: All expected data rows imported",
    "Foreign Keys: All relationships preserved",
    "RLS Policies: Row Level Security active",
    "Auth Users: All users migrated successfully", 
    "User Profiles: Profiles linked to auth users",
    "Application Test: Core functionality works",
    "Performance: Acceptable response times",
    "Security: Auth and permissions working"
)

foreach ($item in $checklist) {
    Write-Host "[ ] $item" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📞 NEXT STEPS" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Run the queries in: $verificationFile"
Write-Host "2. Test user authentication in your application"
Write-Host "3. Verify all application features work correctly"
Write-Host "4. Check performance under normal load"
Write-Host "5. Update environment variables for production"
Write-Host "6. Send password reset emails to users"
Write-Host "7. Update documentation and team access"
Write-Host ""

if ((Get-Date).Hour -lt 17) {
    Write-Success "Migration verification started during business hours - good timing for testing!"
} else {
    Write-Warning "Migration verification started after hours - consider user impact for any issues found."
}

Write-Host ""
Write-Host "Migration verification script completed." -ForegroundColor Green
Write-Host "Review the generated SQL file and run the queries manually in Supabase." -ForegroundColor Green 