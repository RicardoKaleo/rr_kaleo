# Fix Data Compatibility Script
# This script handles schema differences between local and cloud database
# Specifically deals with clients table name field structure

param(
    [string]$InputDirectory = "migration_data",
    [string]$OutputDirectory = "migration_data_fixed"
)

Write-Host "🔧 Data Compatibility Fix Tool" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

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

# Create output directory
if (!(Test-Path $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    Write-Success "Created output directory: $OutputDirectory"
}

# Function to fix clients table data
function Fix-ClientsData {
    param(
        [string]$InputFile,
        [string]$OutputFile
    )
    
    Write-Status "Fixing clients table data structure..."
    
    if (!(Test-Path $InputFile)) {
        Write-Warning "Clients data file not found: $InputFile"
        return
    }
    
    $content = Get-Content $InputFile -Raw
    
    # Check if the content uses the old 'name' field or new 'first_name', 'last_name' fields
    if ($content -like "*INSERT INTO public.clients*" -and $content -like "*name*" -and $content -notlike "*first_name*") {
        Write-Status "Converting 'name' field to 'first_name' and 'last_name' fields..."
        
        # Use regex to find and replace INSERT statements
        $pattern = "INSERT INTO public\.clients \(([^)]+)\) VALUES \(([^)]+)\);"
        
        $fixedContent = [regex]::Replace($content, $pattern, {
            param($match)
            
            $columns = $match.Groups[1].Value -split ',\s*'
            $values = $match.Groups[2].Value
            
            # Find the position of the 'name' column
            $nameIndex = -1
            for ($i = 0; $i -lt $columns.Length; $i++) {
                if ($columns[$i].Trim() -eq 'name') {
                    $nameIndex = $i
                    break
                }
            }
            
            if ($nameIndex -eq -1) {
                return $match.Value  # No 'name' column found, return unchanged
            }
            
            # Parse values - this is simplified and may need adjustment for complex cases
            $valuePattern = "(?:[^',]+|'(?:[^']+|'')*')"
            $valueMatches = [regex]::Matches($values, $valuePattern)
            $valueArray = $valueMatches | ForEach-Object { $_.Value.Trim() }
            
            if ($nameIndex -lt $valueArray.Length) {
                $nameValue = $valueArray[$nameIndex].Trim("'")
                
                # Split name into first and last name
                $nameParts = $nameValue -split '\s+', 2
                $firstName = if ($nameParts.Length -gt 0) { $nameParts[0] } else { $nameValue }
                $lastName = if ($nameParts.Length -gt 1) { $nameParts[1] } else { '' }
                
                # Update columns
                $columns[$nameIndex] = 'first_name'
                $newColumns = @($columns[0..$nameIndex]) + @('last_name') + @($columns[($nameIndex + 1)..($columns.Length - 1)])
                
                # Update values
                $valueArray[$nameIndex] = "'$firstName'"
                $newValues = @($valueArray[0..$nameIndex]) + @("'$lastName'") + @($valueArray[($nameIndex + 1)..($valueArray.Length - 1)])
                
                $newColumnsStr = $newColumns -join ', '
                $newValuesStr = $newValues -join ', '
                
                return "INSERT INTO public.clients ($newColumnsStr) VALUES ($newValuesStr);"
            }
            
            return $match.Value  # Return unchanged if something went wrong
        })
        
        $fixedContent | Out-File -FilePath $OutputFile -Encoding UTF8
        Write-Success "Fixed clients data saved to: $OutputFile"
    } else {
        Write-Status "Clients data already uses correct schema or not found, copying as-is..."
        Copy-Item $InputFile $OutputFile -Force
    }
}

# Function to fix seed data compatibility
function Fix-SeedDataCompatibility {
    param([string]$OutputFile)
    
    Write-Status "Creating compatibility-fixed seed data..."
    
    $fixedSeedContent = @"
-- Fixed Seed Data for Cloud Migration
-- This version uses first_name/last_name instead of name field

-- Clear existing data (except user_profiles)
TRUNCATE TABLE client_final_users CASCADE;
TRUNCATE TABLE client_managers CASCADE;
TRUNCATE TABLE job_listings CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE recruiters CASCADE;
TRUNCATE TABLE job_recruiters CASCADE;
TRUNCATE TABLE email_templates CASCADE;

-- Insert sample clients (individual job seekers) - FIXED VERSION
INSERT INTO clients (id, first_name, last_name, email, company, phone, linkedin_url, notes, status, created_at) VALUES
-- Technology Job Seekers
('550e8400-e29b-41d4-a716-446655440001', 'Alex', 'Johnson', 'alex.johnson@email.com', 'TechCorp Inc', '+1-555-0101', 'https://linkedin.com/in/alexjohnson', 'Senior Full Stack Developer with 8 years experience in React, Node.js, and cloud technologies', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Sarah', 'Chen', 'sarah.chen@email.com', 'DataViz Solutions', '+1-555-0102', 'https://linkedin.com/in/sarahchen', 'Data Scientist specializing in machine learning and Python with 6 years experience', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Michael', 'Rodriguez', 'michael.rodriguez@email.com', 'CloudTech Systems', '+1-555-0103', 'https://linkedin.com/in/michaelrodriguez', 'DevOps Engineer with expertise in AWS, Docker, and Kubernetes', 'active', NOW()),

-- Healthcare Job Seekers  
('550e8400-e29b-41d4-a716-446655440004', 'Emily', 'Thompson', 'emily.thompson@email.com', 'HealthTech Innovations', '+1-555-0104', 'https://linkedin.com/in/emilythompson', 'Healthcare Software Engineer with medical background and 5 years in health tech', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'David', 'Kim', 'david.kim@email.com', 'MediCare Systems', '+1-555-0105', 'https://linkedin.com/in/davidkim', 'Clinical Data Analyst with expertise in healthcare databases and compliance', 'active', NOW()),

-- Finance Job Seekers
('550e8400-e29b-41d4-a716-446655440006', 'Lisa', 'Wang', 'lisa.wang@email.com', 'FinTech Dynamics', '+1-555-0106', 'https://linkedin.com/in/lisawang', 'Financial Software Engineer with 7 years experience in payment systems and fintech', 'active', NOW()),

-- E-commerce Job Seekers
('550e8400-e29b-41d4-a716-446655440007', 'James', 'Wilson', 'james.wilson@email.com', 'ShopSmart Retail', '+1-555-0107', 'https://linkedin.com/in/jameswilson', 'E-commerce Developer with expertise in Shopify, WooCommerce, and custom platforms', 'active', NOW());

-- Note: clients_meta table data remains the same as it references client_id

-- Copy the rest of the seed data from the original seed.sql
-- (recruiters, job_listings, client_managers, client_final_users, etc.)
"@
    
    $fixedSeedContent | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Success "Created fixed seed data: $OutputFile"
}

# Main execution
Write-Status "Starting data compatibility fixes..."

# Copy all files from input to output directory first
if (Test-Path $InputDirectory) {
    Get-ChildItem $InputDirectory | ForEach-Object {
        if ($_.Name -ne "clients.sql") {
            Copy-Item $_.FullName (Join-Path $OutputDirectory $_.Name) -Force
        }
    }
    Write-Status "Copied non-problematic files to output directory"
} else {
    Write-Warning "Input directory not found: $InputDirectory"
    Write-Status "Will create fixed seed data anyway..."
}

# Fix clients table data
$clientsInputFile = Join-Path $InputDirectory "clients.sql"
$clientsOutputFile = Join-Path $OutputDirectory "clients.sql"
Fix-ClientsData -InputFile $clientsInputFile -OutputFile $clientsOutputFile

# Create fixed seed data
$fixedSeedFile = Join-Path $OutputDirectory "seed_data_fixed.sql"
Fix-SeedDataCompatibility -OutputFile $fixedSeedFile

# Create data transformation SQL script
$transformScript = Join-Path $OutputDirectory "transform_existing_data.sql"
$transformContent = @"
-- Data Transformation Script
-- Run this if you need to transform existing data in cloud database

-- Transform existing clients table from 'name' to 'first_name', 'last_name'
-- WARNING: This will modify existing data, backup first!

-- Add new columns if they don't exist
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update data (split existing name field)
UPDATE clients 
SET 
    first_name = CASE 
        WHEN position(' ' in name) > 0 THEN split_part(name, ' ', 1)
        ELSE name
    END,
    last_name = CASE 
        WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
        ELSE ''
    END
WHERE first_name IS NULL OR last_name IS NULL;

-- Make first_name required after data transformation
ALTER TABLE clients ALTER COLUMN first_name SET NOT NULL;

-- Drop old name column (only after verifying data looks correct!)
-- ALTER TABLE clients DROP COLUMN name;
"@

$transformContent | Out-File -FilePath $transformScript -Encoding UTF8
Write-Success "Created data transformation script: transform_existing_data.sql"

Write-Host ""
Write-Success "Data compatibility fixes completed!"
Write-Host ""
Write-Host "Fixed Files:" -ForegroundColor Cyan
Write-Host "- $OutputDirectory/clients.sql (fixed schema)"
Write-Host "- $OutputDirectory/seed_data_fixed.sql (fixed seed data)"
Write-Host "- $OutputDirectory/transform_existing_data.sql (for existing data)"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Use files from '$OutputDirectory' for your migration"
Write-Host "2. Apply the complete migration schema first"
Write-Host "3. Import the fixed data files"
Write-Host "4. Verify all relationships work correctly" 