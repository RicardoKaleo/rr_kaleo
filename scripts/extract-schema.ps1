# Extract Current Schema Script
# This script helps extract your current database schema

Write-Host "📋 Extracting current database schema..." -ForegroundColor Blue

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

# Extract schema using Supabase CLI
function Extract-Schema {
    Write-Status "Extracting schema using Supabase CLI..."
    
    try {
        # Get the current schema
        $schemaFile = "current_schema.sql"
        
        Write-Status "Extracting schema to: $schemaFile"
        
        # Use Supabase CLI to get schema
        supabase db dump --schema-only > $schemaFile
        
        if (Test-Path $schemaFile) {
            Write-Success "Schema extracted to: $schemaFile"
            Write-Host ""
            Write-Host "Next steps:"
            Write-Host "1. Review the extracted schema: $schemaFile"
            Write-Host "2. Copy the relevant parts to your migration file"
            Write-Host "3. Update the migration file with your complete schema"
        }
        else {
            Write-Error "Failed to extract schema"
        }
    }
    catch {
        Write-Error "Failed to extract schema: $_"
        Write-Host ""
        Write-Host "Alternative method:"
        Write-Host "1. Go to your local Supabase dashboard"
        Write-Host "2. Navigate to SQL Editor"
        Write-Host "3. Run: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
        Write-Host "4. For each table, run: \\d+ table_name"
        Write-Host "5. Copy the CREATE TABLE statements"
    }
}

# Manual schema extraction guide
function Show-ManualExtractionGuide {
    Write-Status "Manual Schema Extraction Guide"
    
    Write-Host ""
    Write-Host "Since automatic extraction failed, here's how to manually extract your schema:"
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

# Create a template migration with common tables
function Create-TemplateMigration {
    Write-Status "Creating template migration with common tables..."
    
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $migrationFile = "supabase/migrations/$timestamp`_complete_schema.sql"
    
    # Create migrations directory if it doesn't exist
    if (!(Test-Path "supabase/migrations")) {
        New-Item -ItemType Directory -Path "supabase/migrations" -Force
    }
    
    $templateContent = @"
-- Complete Schema Migration Template
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
-- ADD YOUR ACTUAL TABLES BELOW
-- ========================================

-- Example: User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'final_user',
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example: Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    linkedin_url TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example: Job Listings
CREATE TABLE IF NOT EXISTS job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    salary_range TEXT,
    job_url TEXT,
    description TEXT,
    requirements TEXT[],
    application_method application_method NOT NULL,
    application_url TEXT,
    status job_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example: Recruiters
CREATE TABLE IF NOT EXISTS recruiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    company TEXT,
    position TEXT,
    linkedin_url TEXT,
    phone TEXT,
    notes TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example: Gmail Integrations
CREATE TABLE IF NOT EXISTS gmail_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    email_address TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example: Email Campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
    gmail_integration_id UUID REFERENCES gmail_integrations(id),
    template_id UUID,
    custom_subject TEXT,
    custom_body TEXT,
    status TEXT DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    thread_id TEXT,
    reply_status TEXT DEFAULT 'sent',
    replied_at TIMESTAMP WITH TIME ZONE,
    reply_content TEXT,
    reply_sender TEXT,
    reply_message_id TEXT,
    last_history_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ADD MORE TABLES AS NEEDED
-- ========================================

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (permissive for development)
CREATE POLICY "Enable all access for authenticated users" ON user_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON job_listings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON recruiters FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON gmail_integrations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON email_campaigns FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_job_listings_client_id ON job_listings(client_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_gmail_integration_id ON email_campaigns(gmail_integration_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_thread_id ON email_campaigns(thread_id);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_listings_updated_at BEFORE UPDATE ON job_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recruiters_updated_at BEFORE UPDATE ON recruiters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"@
    
    $templateContent | Out-File -FilePath $migrationFile -Encoding UTF8
    
    Write-Success "Template migration created: $migrationFile"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Open the file: $migrationFile"
    Write-Host "2. Replace the example tables with your actual tables"
    Write-Host "3. Add any missing tables, indexes, or policies"
    Write-Host "4. Test locally: supabase db reset"
    Write-Host "5. Apply to production via Supabase dashboard"
}

# Main execution
Write-Host "📋 Schema Extraction Tool" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Choose option: 1) Extract with Supabase CLI, 2) Manual extraction guide, 3) Create template migration (1/2/3)"

switch ($choice) {
    "1" { Extract-Schema }
    "2" { Show-ManualExtractionGuide }
    "3" { Create-TemplateMigration }
    default { 
        Write-Warning "Invalid choice, showing manual extraction guide"
        Show-ManualExtractionGuide 
    }
}

Write-Host ""
Write-Success "Schema extraction process completed!" 