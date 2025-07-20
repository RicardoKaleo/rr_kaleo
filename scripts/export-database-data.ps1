# Export Database Data Script
# This script exports all table data from your local Supabase database
# to SQL INSERT statements for cloud migration

param(
    [string]$OutputDirectory = "migration_data",
    [string]$DatabaseHost = "127.0.0.1",
    [string]$DatabasePort = "54332",
    [string]$DatabaseName = "postgres",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "postgres"
)

Write-Host "🗄️  Database Data Export Tool" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
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

# Check if pg_dump is available
function Test-PostgreSQLTools {
    try {
        $pgDumpVersion = & pg_dump --version 2>$null
        if ($pgDumpVersion) {
            Write-Success "PostgreSQL tools found: $($pgDumpVersion.Split(' ')[2])"
            return $true
        }
    } catch {
        Write-Error "PostgreSQL tools (pg_dump) not found in PATH"
        Write-Warning "Please install PostgreSQL client tools or add them to PATH"
        Write-Warning "You can download them from: https://www.postgresql.org/download/"
        return $false
    }
}

# Create output directory
function New-OutputDirectory {
    param([string]$Directory)
    
    if (Test-Path $Directory) {
        Write-Warning "Output directory '$Directory' already exists. Contents will be overwritten."
        Remove-Item "$Directory\*" -Force -Recurse -ErrorAction SilentlyContinue
    } else {
        New-Item -ItemType Directory -Path $Directory -Force | Out-Null
        Write-Success "Created output directory: $Directory"
    }
}

# Export table data
function Export-TableData {
    param(
        [string]$TableName,
        [string]$OutputFile
    )
    
    Write-Status "Exporting table: $TableName"
    
    try {
        # Export data as INSERT statements
        $command = "pg_dump"
        $arguments = @(
            "--host", $DatabaseHost
            "--port", $DatabasePort
            "--username", $DatabaseUser
            "--dbname", $DatabaseName
            "--data-only"
            "--inserts"
            "--table", "public.$TableName"
            "--file", $OutputFile
        )
        
        $env:PGPASSWORD = $DatabasePassword
        & $command @arguments
        
        if ($LASTEXITCODE -eq 0) {
            $fileSize = (Get-Item $OutputFile).Length
            Write-Success "Exported $TableName ($($fileSize) bytes)"
        } else {
            Write-Error "Failed to export $TableName"
        }
    } catch {
        Write-Error "Error exporting $TableName`: $($_.Exception.Message)"
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Export auth users data
function Export-AuthData {
    param([string]$OutputFile)
    
    Write-Status "Exporting auth users data"
    
    try {
        # Create a temporary SQL file for the query
        $tempQueryFile = [System.IO.Path]::GetTempFileName()
        $query = @"
COPY (
    SELECT 
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        phone,
        phone_confirmed_at
    FROM auth.users
    WHERE deleted_at IS NULL
) TO STDOUT WITH CSV HEADER;
"@
        
        $query | Out-File -FilePath $tempQueryFile -Encoding UTF8
        
        $command = "psql"
        $arguments = @(
            "--host", $DatabaseHost
            "--port", $DatabasePort
            "--username", $DatabaseUser
            "--dbname", $DatabaseName
            "--file", $tempQueryFile
            "--output", $OutputFile
        )
        
        $env:PGPASSWORD = $DatabasePassword
        & $command @arguments
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Exported auth users data"
        } else {
            Write-Error "Failed to export auth users data"
        }
        
        # Clean up temp file
        Remove-Item $tempQueryFile -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Error "Error exporting auth data`: $($_.Exception.Message)"
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Main execution
function Start-DataExport {
    Write-Status "Starting database data export..."
    
    # Test PostgreSQL tools
    if (-not (Test-PostgreSQLTools)) {
        exit 1
    }
    
    # Create output directory
    New-OutputDirectory -Directory $OutputDirectory
    
    # Define tables to export (in dependency order)
    $tables = @(
        "user_profiles",
        "clients",
        "client_managers",
        "client_final_users",
        "clients_meta",
        "recruiters",
        "job_listings",
        "job_recruiters",
        "gmail_integrations",
        "google_drive_integrations",
        "email_templates",
        "email_campaigns",
        "email_campaign_followups",
        "gmail_watch_subscriptions",
        "gmail_history_tracking",
        "data_access_logs"
    )
    
    Write-Status "Exporting $($tables.Count) tables..."
    
    # Export each table
    foreach ($table in $tables) {
        $outputFile = Join-Path $OutputDirectory "$table.sql"
        Export-TableData -TableName $table -OutputFile $outputFile
    }
    
    # Export auth data
    $authOutputFile = Join-Path $OutputDirectory "auth_users.csv"
    Export-AuthData -OutputFile $authOutputFile
    
    # Create import script
    Create-ImportScript -OutputDirectory $OutputDirectory -Tables $tables
    
    Write-Success "Data export completed!"
    Write-Host ""
    Write-Host "Export Summary:" -ForegroundColor Cyan
    Write-Host "- Output directory: $OutputDirectory"
    Write-Host "- Table data files: $($tables.Count) SQL files"
    Write-Host "- Auth data file: auth_users.csv"
    Write-Host "- Import script: import_data.sql"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Review the exported files"
    Write-Host "2. Create your cloud Supabase project"
    Write-Host "3. Apply the schema migration first"
    Write-Host "4. Import auth data through Supabase Dashboard"
    Write-Host "5. Run the import_data.sql script"
}

# Create import script
function Create-ImportScript {
    param(
        [string]$OutputDirectory,
        [array]$Tables
    )
    
    Write-Status "Creating import script..."
    
    $importScript = Join-Path $OutputDirectory "import_data.sql"
    
    $scriptContent = @"
-- Data Import Script
-- Run this script in your cloud Supabase SQL Editor
-- Make sure to import auth users first through the dashboard

-- Disable triggers during import to avoid conflicts
SET session_replication_role = replica;

-- Import table data (run each file's content in order)
"@
    
    foreach ($table in $Tables) {
        $scriptContent += "`n-- Import $table data`n"
        $scriptContent += "-- Copy and paste the content from $table.sql here`n`n"
    }
    
    $scriptContent += @"

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Update sequences to current max IDs (if using serial columns)
-- Note: This migration uses UUIDs, so this may not be necessary

-- Verify data import
SELECT 'user_profiles' as table_name, count(*) as row_count FROM user_profiles
UNION ALL
SELECT 'clients', count(*) FROM clients
UNION ALL
SELECT 'job_listings', count(*) FROM job_listings
UNION ALL
SELECT 'recruiters', count(*) FROM recruiters
UNION ALL
SELECT 'email_templates', count(*) FROM email_templates;

-- Check for any foreign key constraint violations
-- (Should return no rows if everything is imported correctly)
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'f'
AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = pg_constraint.conname
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN (
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    )
);
"@
    
    $scriptContent | Out-File -FilePath $importScript -Encoding UTF8
    Write-Success "Created import script: import_data.sql"
}

# Run the export
Start-DataExport

Write-Host ""
Write-Warning "Important Notes:"
Write-Host "1. Auth data export requires manual import through Supabase Dashboard"
Write-Host "2. Make sure to preserve user IDs when importing auth data"
Write-Host "3. Test the migration on a staging environment first"
Write-Host "4. Some sensitive data (access tokens) should be regenerated, not migrated" 