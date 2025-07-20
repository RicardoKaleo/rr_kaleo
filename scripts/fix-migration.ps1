# Simple Migration Fix Script
# This script helps you create a complete migration file

Write-Host "🔧 Migration Fix Tool" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
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

# Create a complete migration file
function Create-CompleteMigration {
    Write-Status "Creating complete migration file..."
    
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $migrationFile = "supabase/migrations/$timestamp`_complete_schema.sql"
    
    # Create migrations directory if it doesn't exist
    if (!(Test-Path "supabase/migrations")) {
        New-Item -ItemType Directory -Path "supabase/migrations" -Force
    }
    
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

-- ========================================
-- YOUR ACTUAL TABLES GO HERE
-- ========================================

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
    
    $migrationContent | Out-File -FilePath $migrationFile -Encoding UTF8
    
    Write-Success "Migration file created: $migrationFile"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Open the file: $migrationFile"
    Write-Host "2. Add all your actual table definitions"
    Write-Host "3. Test locally: supabase db reset"
    Write-Host "4. Apply to production via Supabase dashboard"
}

# Show manual extraction guide
function Show-ExtractionGuide {
    Write-Status "Manual Schema Extraction Guide"
    
    Write-Host ""
    Write-Host "To get your complete schema, follow these steps:"
    Write-Host ""
    Write-Host "1. Go to your local Supabase dashboard (usually http://localhost:54323)"
    Write-Host "2. Navigate to SQL Editor"
    Write-Host "3. Run these queries to get your complete schema:"
    Write-Host ""
    Write-Host "   -- Get all table names"
    Write-Host "   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    Write-Host ""
    Write-Host "   -- Get table definitions"
    Write-Host "   SELECT schemaname, tablename, tableowner FROM pg_tables WHERE schemaname = 'public';"
    Write-Host ""
    Write-Host "   -- Get column information for a specific table"
    Write-Host "   SELECT column_name, data_type, is_nullable, column_default"
    Write-Host "   FROM information_schema.columns"
    Write-Host "   WHERE table_schema = 'public' AND table_name = 'your_table_name';"
    Write-Host ""
    Write-Host "4. For each table, get the CREATE statement:"
    Write-Host "   SELECT pg_get_tabledef('public.your_table_name');"
    Write-Host ""
    Write-Host "5. Copy all the CREATE statements to your migration file"
    Write-Host ""
    
    Write-Success "Manual extraction guide provided"
}

# Main execution
$choice = Read-Host "Choose option: 1) Create migration file, 2) Show extraction guide (1/2)"

switch ($choice) {
    "1" { Create-CompleteMigration }
    "2" { Show-ExtractionGuide }
    default { 
        Write-Warning "Invalid choice, creating migration file"
        Create-CompleteMigration 
    }
}

Write-Host ""
Write-Success "Migration fix process completed!" 