# Generate Complete Migration Script
# This script helps generate a complete migration from your local Supabase database

Write-Host "🔧 Generating complete migration from local database..." -ForegroundColor Blue

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

# Check if Supabase CLI is available
function Test-SupabaseCLI {
    try {
        supabase --version | Out-Null
        Write-Success "Supabase CLI is available"
        return $true
    }
    catch {
        Write-Error "Supabase CLI is not installed or not in PATH"
        Write-Host "Please install it: npm install -g supabase"
        return $false
    }
}

# Generate migration using Supabase CLI
function Generate-Migration {
    Write-Status "Generating migration using Supabase CLI..."
    
    try {
        # Generate a new migration
        $timestamp = Get-Date -Format "yyyyMMddHHmmss"
        $migrationName = "complete_schema_$timestamp"
        
        Write-Status "Creating migration: $migrationName"
        supabase migration new $migrationName
        
        Write-Success "Migration file created: supabase/migrations/$migrationName.sql"
        Write-Host ""
        Write-Host "Next steps:"
        Write-Host "1. Open the generated migration file"
        Write-Host "2. Copy your complete schema into it"
        Write-Host "3. Run: supabase db reset (to test locally)"
        Write-Host "4. Apply to production via Supabase dashboard"
    }
    catch {
        Write-Error "Failed to generate migration: $_"
    }
}

# Manual migration generation
function Generate-ManualMigration {
    Write-Status "Generating manual migration file..."
    
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $migrationFile = "supabase/migrations/$timestamp`_complete_schema.sql"
    
    $migrationContent = @"
-- Complete Schema Migration
-- Generated on $(Get-Date)
-- This file contains all tables and configurations for production

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('manager', 'final_user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_method AS ENUM ('email', 'linkedin', 'indeed', 'glassdoor', 'company_portal', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('active', 'paused', 'closed', 'applied', 'interview_scheduled', 'rejected', 'offer_received');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TODO: Add all your actual tables here
-- Copy the CREATE TABLE statements from your local database

-- Example structure (replace with your actual tables):
-- CREATE TABLE IF NOT EXISTS your_table_name (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     -- your columns here
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Enable Row Level Security (RLS)
-- ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- CREATE POLICY "Enable all access for authenticated users" ON your_table_name FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
-- CREATE INDEX IF NOT EXISTS idx_your_table_column ON your_table_name(column_name);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (add for each table)
-- CREATE TRIGGER update_your_table_updated_at BEFORE UPDATE ON your_table_name FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"@
    
    # Create migrations directory if it doesn't exist
    if (!(Test-Path "supabase/migrations")) {
        New-Item -ItemType Directory -Path "supabase/migrations" -Force
    }
    
    $migrationContent | Out-File -FilePath $migrationFile -Encoding UTF8
    
    Write-Success "Manual migration file created: $migrationFile"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Open the file: $migrationFile"
    Write-Host "2. Add all your actual table definitions"
    Write-Host "3. Test locally: supabase db reset"
    Write-Host "4. Apply to production via Supabase dashboard"
}

# Main execution
Write-Host "🏗️  Migration Generator" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

if (Test-SupabaseCLI) {
    $choice = Read-Host "Choose option: 1) Use Supabase CLI, 2) Generate manual file (1/2)"
    
    if ($choice -eq "1") {
        Generate-Migration
    }
    else {
        Generate-ManualMigration
    }
}
else {
    Write-Warning "Falling back to manual migration generation"
    Generate-ManualMigration
}

Write-Host ""
Write-Success "Migration generation completed!" 