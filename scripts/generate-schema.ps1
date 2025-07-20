# Generate Schema Script
# This script helps extract your current database schema using correct queries

Write-Host "📋 Schema Generation Tool" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
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

# Create SQL queries file
function Create-SchemaQueries {
    Write-Status "Creating SQL queries file..."
    
    $queriesFile = "schema_queries.sql"
    
    $queriesContent = @"
-- Schema Extraction Queries
-- Run these in your local Supabase SQL Editor

-- 1. Get all table names
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Get table structure for a specific table (replace 'table_name')
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'your_table_name'
ORDER BY ordinal_position;

-- 3. Get foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public';

-- 4. Get indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Get RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public';

-- 6. Get custom types
SELECT 
    typname,
    typtype,
    typdefault
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typtype = 'e';

-- 7. Get functions
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
"@
    
    $queriesContent | Out-File -FilePath $queriesFile -Encoding UTF8
    
    Write-Success "SQL queries file created: $queriesFile"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Open your local Supabase dashboard (http://localhost:54323)"
    Write-Host "2. Go to SQL Editor"
    Write-Host "3. Copy and run the queries from: $queriesFile"
    Write-Host "4. Use the results to build your migration file"
}

# Create migration template
function Create-MigrationTemplate {
    Write-Status "Creating migration template..."
    
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $migrationFile = "supabase/migrations/$timestamp`_complete_schema.sql"
    
    # Create migrations directory if it doesn't exist
    if (!(Test-Path "supabase/migrations")) {
        New-Item -ItemType Directory -Path "supabase/migrations" -Force
    }
    
    $templateContent = @"
-- Complete Schema Migration
-- Generated on $(Get-Date)
-- Add your actual table definitions below

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
-- Use the schema queries to get the correct structure

-- Example: User Profiles
-- CREATE TABLE IF NOT EXISTS user_profiles (
--     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--     role user_role NOT NULL DEFAULT 'final_user',
--     full_name TEXT NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Example: Clients
-- CREATE TABLE IF NOT EXISTS clients (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     email TEXT NOT NULL,
--     company TEXT,
--     phone TEXT,
--     linkedin_url TEXT,
--     notes TEXT,
--     status TEXT DEFAULT 'active',
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- ========================================
-- ADD MORE TABLES AS NEEDED
-- ========================================

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
    
    $templateContent | Out-File -FilePath $migrationFile -Encoding UTF8
    
    Write-Success "Migration template created: $migrationFile"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Run the schema queries to get your table structures"
    Write-Host "2. Open the migration file: $migrationFile"
    Write-Host "3. Add your actual table definitions"
    Write-Host "4. Test locally: supabase db reset"
    Write-Host "5. Apply to production via Supabase dashboard"
}

# Show step-by-step guide
function Show-StepByStepGuide {
    Write-Status "Step-by-Step Schema Extraction Guide"
    
    Write-Host ""
    Write-Host "Follow these steps to extract your complete schema:"
    Write-Host ""
    Write-Host "Step 1: Get all table names"
    Write-Host "   Run: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    Write-Host ""
    Write-Host "Step 2: For each table, get its structure"
    Write-Host "   Run: SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'TABLE_NAME' ORDER BY ordinal_position;"
    Write-Host ""
    Write-Host "Step 3: Get foreign keys"
    Write-Host "   Run the foreign key query from the generated SQL file"
    Write-Host ""
    Write-Host "Step 4: Get indexes"
    Write-Host "   Run: SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';"
    Write-Host ""
    Write-Host "Step 5: Get RLS policies"
    Write-Host "   Run: SELECT * FROM pg_policies WHERE schemaname = 'public';"
    Write-Host ""
    Write-Host "Step 6: Build your migration file"
    Write-Host "   Use the results to create proper CREATE TABLE statements"
    Write-Host ""
    
    Write-Success "Step-by-step guide provided"
}

# Main execution
$choice = Read-Host "Choose option: 1) Create SQL queries file, 2) Create migration template, 3) Show step-by-step guide (1/2/3)"

switch ($choice) {
    "1" { Create-SchemaQueries }
    "2" { Create-MigrationTemplate }
    "3" { Show-StepByStepGuide }
    default { 
        Write-Warning "Invalid choice, creating SQL queries file"
        Create-SchemaQueries 
    }
}

Write-Host ""
Write-Success "Schema generation process completed!" 