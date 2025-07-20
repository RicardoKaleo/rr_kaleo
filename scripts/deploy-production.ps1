# Production Deployment Script for Reverse Recruiting SaaS (PowerShell)
# This script helps manage the transition from local to production Supabase

param(
    [switch]$SkipPrompts
)

Write-Host "🚀 Starting production deployment process..." -ForegroundColor Blue

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

# Function to get user input
function Get-UserInput {
    param([string]$Prompt)
    return Read-Host $Prompt
}

# Function to confirm action
function Confirm-Action {
    param([string]$Message)
    $response = Read-Host "$Message (y/N)"
    return $response -eq "y" -or $response -eq "Y"
}

# Check if required tools are installed
function Test-Dependencies {
    Write-Status "Checking dependencies..."
    
    # Check if Git is available
    try {
        git --version | Out-Null
        Write-Success "Git is available"
    }
    catch {
        Write-Error "Git is not installed or not in PATH"
        exit 1
    }
    
    # Check if Node.js is available
    try {
        node --version | Out-Null
        Write-Success "Node.js is available"
    }
    catch {
        Write-Error "Node.js is not installed or not in PATH"
        exit 1
    }
    
    Write-Success "Dependencies check completed"
}

# Step 1: Production Supabase Setup
function Setup-ProductionSupabase {
    Write-Status "Step 1: Setting up production Supabase project"
    
    Write-Host ""
    Write-Host "Please follow these steps:"
    Write-Host "1. Go to https://supabase.com"
    Write-Host "2. Create a new project for production"
    Write-Host "3. Note down the project URL and keys"
    Write-Host ""
    
    $script:PROD_URL = Get-UserInput "Enter your production Supabase URL"
    $script:PROD_ANON_KEY = Get-UserInput "Enter your production Supabase anon key"
    $script:PROD_SERVICE_ROLE_KEY = Get-UserInput "Enter your production Supabase service role key"
    
    # Save production credentials
    $envContent = @"
# Production Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$PROD_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$PROD_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$PROD_SERVICE_ROLE_KEY
"@
    
    $envContent | Out-File -FilePath ".env.production" -Encoding UTF8
    
    Write-Success "Production Supabase credentials saved to .env.production"
}

# Step 2: Run schema migration
function Invoke-SchemaMigration {
    Write-Status "Step 2: Running schema migration on production database"
    
    if (Confirm-Action "Do you want to run the schema migration on production?") {
        Write-Warning "This will create all tables and configurations on your production database"
        
        if (Confirm-Action "Are you sure you want to proceed?") {
            Write-Status "Please run the migration manually:"
            Write-Host ""
            Write-Host "1. Go to your Supabase dashboard"
            Write-Host "2. Navigate to SQL Editor"
            Write-Host "3. Copy and paste the contents of: supabase/migrations/20241201000001_production_schema.sql"
            Write-Host "4. Execute the SQL"
            Write-Host ""
            
            Write-Success "Migration instructions provided"
        }
    }
}

# Step 3: Data migration (optional)
function Invoke-DataMigration {
    Write-Status "Step 3: Data migration (optional)"
    
    if (Confirm-Action "Do you want to migrate data from local to production?") {
        Write-Warning "This will copy data from your local database to production"
        
        if (Confirm-Action "Are you sure? This will overwrite existing data in production.") {
            Write-Status "Please run the following commands manually:"
            Write-Host ""
            Write-Host "# Export data from local database"
            Write-Host "pg_dump 'your_local_connection_string' --data-only --table=clients --table=job_listings --table=recruiters > local_data.sql"
            Write-Host ""
            Write-Host "# Import data to production database"
            Write-Host "psql '$PROD_URL' < local_data.sql"
            Write-Host ""
            Write-Warning "Make sure to update any local file paths or URLs in the data"
        }
    }
}

# Step 4: Environment variables setup
function Setup-EnvironmentVariables {
    Write-Status "Step 4: Setting up environment variables for Vercel"
    
    Write-Host ""
    Write-Host "Please add these environment variables to your Vercel project:"
    Write-Host ""
    
    if (Test-Path ".env.production") {
        Get-Content ".env.production"
    }
    
    Write-Host ""
    Write-Host "Additional variables you'll need:"
    Write-Host "NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id"
    Write-Host "GOOGLE_CLIENT_SECRET=your_google_client_secret"
    Write-Host "NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback/google"
    Write-Host "NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app"
    Write-Host ""
    
    Write-Success "Environment variables documented"
}

# Step 5: Google OAuth setup
function Setup-GoogleOAuth {
    Write-Status "Step 5: Setting up Google OAuth for production"
    
    Write-Host ""
    Write-Host "Please update your Google OAuth configuration:"
    Write-Host "1. Go to https://console.cloud.google.com"
    Write-Host "2. Navigate to APIs & Services > Credentials"
    Write-Host "3. Edit your OAuth 2.0 Client ID"
    Write-Host "4. Add your production redirect URI:"
    Write-Host "   https://your-domain.vercel.app/api/auth/callback/google"
    Write-Host "5. Add your production domain to authorized origins"
    Write-Host ""
    
    Write-Success "Google OAuth setup documented"
}

# Step 6: Deploy to Vercel
function Deploy-ToVercel {
    Write-Status "Step 6: Deploying to Vercel"
    
    if (Confirm-Action "Do you want to deploy to Vercel now?") {
        Write-Status "Pushing to GitHub..."
        
        try {
            git add .
            git commit -m "Prepare for production deployment"
            git push origin main
            
            Write-Success "Code pushed to GitHub"
            Write-Host ""
            Write-Host "Vercel will automatically deploy your changes."
            Write-Host "Make sure you've added all environment variables in the Vercel dashboard."
            Write-Host ""
        }
        catch {
            Write-Error "Failed to push to GitHub. Please check your Git configuration."
        }
    }
    else {
        Write-Status "Manual deployment steps:"
        Write-Host "1. Push your code to GitHub"
        Write-Host "2. Go to Vercel dashboard"
        Write-Host "3. Import your repository"
        Write-Host "4. Add environment variables"
        Write-Host "5. Deploy"
    }
}

# Step 7: Post-deployment verification
function Invoke-PostDeploymentChecks {
    Write-Status "Step 7: Post-deployment verification checklist"
    
    Write-Host ""
    Write-Host "After deployment, verify the following:"
    Write-Host "✅ Authentication works (login/register)"
    Write-Host "✅ Database connection is working"
    Write-Host "✅ Gmail OAuth integration works"
    Write-Host "✅ Email sending functionality"
    Write-Host "✅ Webhook endpoints are accessible"
    Write-Host "✅ All CRUD operations work"
    Write-Host ""
    
    Write-Success "Deployment process completed!"
}

# Main execution
function Main {
    Write-Host "🏗️  Production Deployment Script (PowerShell)" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    
    Test-Dependencies
    Setup-ProductionSupabase
    Invoke-SchemaMigration
    Invoke-DataMigration
    Setup-EnvironmentVariables
    Setup-GoogleOAuth
    Deploy-ToVercel
    Invoke-PostDeploymentChecks
    
    Write-Host ""
    Write-Success "🎉 Deployment script completed successfully!"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Test your production deployment"
    Write-Host "2. Update any hardcoded URLs in your code"
    Write-Host "3. Monitor logs for any issues"
    Write-Host "4. Set up monitoring and analytics"
}

# Run the script
Main 