# Migrate Auth Users Script
# This script migrates users from exported auth data to Supabase Cloud
# using the Supabase Admin API

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$ServiceKey,
    
    [string]$InputFile = "migration_data/auth_users.csv",
    [string]$TempPassword = "TempPass123!",
    [bool]$SendInviteEmails = $false,
    [bool]$DryRun = $false
)

Write-Host "👥 Auth Users Migration Tool" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
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

# Function to create user via Supabase Admin API
function New-SupabaseUser {
    param(
        [string]$UserId,
        [string]$Email,
        [string]$Password,
        [hashtable]$UserMetaData,
        [hashtable]$AppMetaData,
        [bool]$EmailConfirmed = $true
    )
    
    $headers = @{
        'apikey' = $ServiceKey
        'Authorization' = "Bearer $ServiceKey"
        'Content-Type' = 'application/json'
    }
    
    $body = @{
        user_id = $UserId
        email = $Email
        password = $Password
        email_confirm = $EmailConfirmed
        user_metadata = $UserMetaData
        app_metadata = $AppMetaData
    } | ConvertTo-Json -Depth 10
    
    $uri = "$ProjectUrl/auth/v1/admin/users"
    
    try {
        if ($DryRun) {
            Write-Status "DRY RUN: Would create user $Email with ID $UserId"
            return @{ success = $true; user = @{ id = $UserId } }
        }
        
        $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
        return @{ success = $true; user = $response }
    }
    catch {
        $errorMessage = $_.Exception.Message
        if ($_.Exception.Response) {
            $errorDetails = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorDetails)
            $errorContent = $reader.ReadToEnd()
            $errorMessage += " - $errorContent"
        }
        return @{ success = $false; error = $errorMessage }
    }
}

# Function to parse CSV and migrate users
function Start-UserMigration {
    param([string]$CsvFile)
    
    if (!(Test-Path $CsvFile)) {
        Write-Error "Auth users file not found: $CsvFile"
        return
    }
    
    Write-Status "Reading users from: $CsvFile"
    
    try {
        $users = Import-Csv $CsvFile
        Write-Status "Found $($users.Count) users to migrate"
        
        if ($DryRun) {
            Write-Warning "DRY RUN MODE - No actual users will be created"
        }
        
        $successCount = 0
        $errorCount = 0
        $errors = @()
        
        foreach ($user in $users) {
            Write-Status "Processing user: $($user.email)"
            
            # Parse metadata JSON if present
            $userMetaData = @{}
            $appMetaData = @{}
            
            if ($user.raw_user_meta_data -and $user.raw_user_meta_data -ne "") {
                try {
                    $userMetaData = $user.raw_user_meta_data | ConvertFrom-Json -AsHashtable
                } catch {
                    Write-Warning "Failed to parse user metadata for $($user.email)"
                }
            }
            
            if ($user.raw_app_meta_data -and $user.raw_app_meta_data -ne "") {
                try {
                    $appMetaData = $user.raw_app_meta_data | ConvertFrom-Json -AsHashtable
                } catch {
                    Write-Warning "Failed to parse app metadata for $($user.email)"
                }
            }
            
            # Create user
            $result = New-SupabaseUser -UserId $user.id -Email $user.email -Password $TempPassword -UserMetaData $userMetaData -AppMetaData $appMetaData -EmailConfirmed ($user.email_confirmed_at -ne "")
            
            if ($result.success) {
                Write-Success "Created user: $($user.email)"
                $successCount++
            } else {
                Write-Error "Failed to create user $($user.email): $($result.error)"
                $errors += @{
                    email = $user.email
                    error = $result.error
                }
                $errorCount++
            }
            
            # Add small delay to avoid rate limiting
            Start-Sleep -Milliseconds 100
        }
        
        Write-Host ""
        Write-Host "Migration Summary:" -ForegroundColor Cyan
        Write-Host "- Successfully created: $successCount users"
        Write-Host "- Failed: $errorCount users"
        
        if ($errors.Count -gt 0) {
            Write-Host ""
            Write-Host "Errors:" -ForegroundColor Red
            foreach ($error in $errors) {
                Write-Host "  - $($error.email): $($error.error)"
            }
        }
        
        if (!$DryRun -and $successCount -gt 0) {
            Write-Host ""
            Write-Warning "IMPORTANT: All users were created with temporary password: $TempPassword"
            Write-Warning "Users should reset their passwords before logging in."
            Write-Host ""
            Write-Host "Next steps:"
            Write-Host "1. Import user_profiles data to link users to application data"
            Write-Host "2. Test authentication with a sample user"
            Write-Host "3. Send password reset emails to all users"
            Write-Host "4. Import remaining application data"
        }
        
    } catch {
        Write-Error "Failed to process CSV file: $($_.Exception.Message)"
    }
}

# Function to send password reset emails
function Send-PasswordResetEmails {
    param([string]$CsvFile)
    
    if (!(Test-Path $CsvFile)) {
        Write-Error "Auth users file not found: $CsvFile"
        return
    }
    
    $users = Import-Csv $CsvFile
    $headers = @{
        'apikey' = $ServiceKey
        'Authorization' = "Bearer $ServiceKey"
        'Content-Type' = 'application/json'
    }
    
    Write-Status "Sending password reset emails to $($users.Count) users..."
    
    foreach ($user in $users) {
        $body = @{
            email = $user.email
        } | ConvertTo-Json
        
        $uri = "$ProjectUrl/auth/v1/recover"
        
        try {
            if (!$DryRun) {
                Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body | Out-Null
            }
            Write-Success "Sent reset email to: $($user.email)"
        } catch {
            Write-Error "Failed to send reset email to $($user.email): $($_.Exception.Message)"
        }
        
        Start-Sleep -Milliseconds 200
    }
}

# Validate parameters
if (!$ProjectUrl.StartsWith("https://")) {
    Write-Error "Project URL must start with https://"
    exit 1
}

if ($ServiceKey.Length -lt 50) {
    Write-Error "Service key appears to be invalid (too short)"
    exit 1
}

Write-Status "Configuration:"
Write-Host "  - Project URL: $ProjectUrl"
Write-Host "  - Input file: $InputFile"
Write-Host "  - Temp password: $TempPassword"
Write-Host "  - Send invites: $SendInviteEmails"
Write-Host "  - Dry run: $DryRun"
Write-Host ""

$confirm = Read-Host "Do you want to proceed with user migration? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Migration cancelled."
    exit 0
}

# Main execution
Start-UserMigration -CsvFile $InputFile

# Optionally send password reset emails
if ($SendInviteEmails -and !$DryRun) {
    Write-Host ""
    $resetConfirm = Read-Host "Send password reset emails to all users? (y/N)"
    if ($resetConfirm -eq "y" -or $resetConfirm -eq "Y") {
        Send-PasswordResetEmails -CsvFile $InputFile
    }
}

Write-Host ""
Write-Success "Auth migration process completed!"

if (!$DryRun) {
    Write-Host ""
    Write-Warning "Security Reminders:"
    Write-Host "1. Change the temporary password for any test users"
    Write-Host "2. Verify all users can authenticate properly"
    Write-Host "3. Ensure RLS policies work with migrated users"
    Write-Host "4. Monitor for any authentication issues"
} 