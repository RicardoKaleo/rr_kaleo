#!/bin/bash

# Production Deployment Script for Reverse Recruiting SaaS
# This script helps manage the transition from local to production Supabase

set -e

echo "🚀 Starting production deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client (psql) not found. You may need it for data migration."
    fi
    
    print_success "Dependencies check completed"
}

# Function to get user input
get_input() {
    read -p "$1: " input
    echo $input
}

# Function to confirm action
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Step 1: Production Supabase Setup
setup_production_supabase() {
    print_status "Step 1: Setting up production Supabase project"
    
    echo
    echo "Please follow these steps:"
    echo "1. Go to https://supabase.com"
    echo "2. Create a new project for production"
    echo "3. Note down the project URL and keys"
    echo
    
    PROD_URL=$(get_input "Enter your production Supabase URL")
    PROD_ANON_KEY=$(get_input "Enter your production Supabase anon key")
    PROD_SERVICE_ROLE_KEY=$(get_input "Enter your production Supabase service role key")
    
    # Save production credentials
    cat > .env.production << EOF
# Production Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$PROD_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$PROD_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$PROD_SERVICE_ROLE_KEY
EOF
    
    print_success "Production Supabase credentials saved to .env.production"
}

# Step 2: Run schema migration
run_schema_migration() {
    print_status "Step 2: Running schema migration on production database"
    
    if confirm "Do you want to run the schema migration on production?"; then
        print_warning "This will create all tables and configurations on your production database"
        
        if confirm "Are you sure you want to proceed?"; then
            # Run the migration using psql
            if command -v psql &> /dev/null; then
                # Extract connection string from URL
                CONNECTION_STRING=$(echo $PROD_URL | sed 's|https://|postgresql://postgres:|' | sed 's|.supabase.co|.supabase.co:5432/postgres|')
                
                print_status "Running migration..."
                psql "$CONNECTION_STRING" -f supabase/migrations/20241201000001_production_schema.sql
                print_success "Schema migration completed"
            else
                print_error "psql not found. Please run the migration manually:"
                echo "1. Go to your Supabase dashboard"
                echo "2. Navigate to SQL Editor"
                echo "3. Copy and paste the contents of: supabase/migrations/20241201000001_production_schema.sql"
                echo "4. Execute the SQL"
            fi
        fi
    fi
}

# Step 3: Data migration (optional)
migrate_data() {
    print_status "Step 3: Data migration (optional)"
    
    if confirm "Do you want to migrate data from local to production?"; then
        print_warning "This will copy data from your local database to production"
        
        if confirm "Are you sure? This will overwrite existing data in production."; then
            print_status "Please run the following commands manually:"
            echo
            echo "# Export data from local database"
            echo "pg_dump 'your_local_connection_string' --data-only --table=clients --table=job_listings --table=recruiters > local_data.sql"
            echo
            echo "# Import data to production database"
            echo "psql '$PROD_URL' < local_data.sql"
            echo
            print_warning "Make sure to update any local file paths or URLs in the data"
        fi
    fi
}

# Step 4: Environment variables setup
setup_environment_variables() {
    print_status "Step 4: Setting up environment variables for Vercel"
    
    echo
    echo "Please add these environment variables to your Vercel project:"
    echo
    cat .env.production
    echo
    echo "Additional variables you'll need:"
    echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id"
    echo "GOOGLE_CLIENT_SECRET=your_google_client_secret"
    echo "NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback/google"
    echo "NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app"
    echo
    
    print_success "Environment variables documented"
}

# Step 5: Google OAuth setup
setup_google_oauth() {
    print_status "Step 5: Setting up Google OAuth for production"
    
    echo
    echo "Please update your Google OAuth configuration:"
    echo "1. Go to https://console.cloud.google.com"
    echo "2. Navigate to APIs & Services > Credentials"
    echo "3. Edit your OAuth 2.0 Client ID"
    echo "4. Add your production redirect URI:"
    echo "   https://your-domain.vercel.app/api/auth/callback/google"
    echo "5. Add your production domain to authorized origins"
    echo
    
    print_success "Google OAuth setup documented"
}

# Step 6: Deploy to Vercel
deploy_to_vercel() {
    print_status "Step 6: Deploying to Vercel"
    
    if confirm "Do you want to deploy to Vercel now?"; then
        print_status "Pushing to GitHub..."
        git add .
        git commit -m "Prepare for production deployment"
        git push origin main
        
        print_success "Code pushed to GitHub"
        echo
        echo "Vercel will automatically deploy your changes."
        echo "Make sure you've added all environment variables in the Vercel dashboard."
        echo
    else
        print_status "Manual deployment steps:"
        echo "1. Push your code to GitHub"
        echo "2. Go to Vercel dashboard"
        echo "3. Import your repository"
        echo "4. Add environment variables"
        echo "5. Deploy"
    fi
}

# Step 7: Post-deployment verification
post_deployment_checks() {
    print_status "Step 7: Post-deployment verification checklist"
    
    echo
    echo "After deployment, verify the following:"
    echo "✅ Authentication works (login/register)"
    echo "✅ Database connection is working"
    echo "✅ Gmail OAuth integration works"
    echo "✅ Email sending functionality"
    echo "✅ Webhook endpoints are accessible"
    echo "✅ All CRUD operations work"
    echo
    
    print_success "Deployment process completed!"
}

# Main execution
main() {
    echo "🏗️  Production Deployment Script"
    echo "================================"
    echo
    
    check_dependencies
    setup_production_supabase
    run_schema_migration
    migrate_data
    setup_environment_variables
    setup_google_oauth
    deploy_to_vercel
    post_deployment_checks
    
    echo
    print_success "🎉 Deployment script completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Test your production deployment"
    echo "2. Update any hardcoded URLs in your code"
    echo "3. Monitor logs for any issues"
    echo "4. Set up monitoring and analytics"
}

# Run the script
main "$@" 