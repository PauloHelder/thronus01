# Thronus V5 - Supabase Migration Script
# This script helps apply migrations to your Supabase project

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Thronus V5 - Supabase Migration Tool" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCLI) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Supabase CLI first:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use the manual method described in SUPABASE_SETUP_GUIDE.md" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create a .env file with your Supabase credentials:" -ForegroundColor Yellow
    Write-Host "  1. Copy .env.example to .env" -ForegroundColor White
    Write-Host "  2. Fill in your Supabase URL and keys" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green
Write-Host ""

# Menu
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Apply all migrations (Schema + RLS)" -ForegroundColor White
Write-Host "  2. Apply schema only" -ForegroundColor White
Write-Host "  3. Apply RLS policies only" -ForegroundColor White
Write-Host "  4. Apply seed data" -ForegroundColor White
Write-Host "  5. Complete setup (Schema + RLS + Seeds)" -ForegroundColor White
Write-Host "  6. Verify installation" -ForegroundColor White
Write-Host "  0. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (0-6)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Applying migrations..." -ForegroundColor Yellow
        Write-Host ""
        
        # Apply schema
        Write-Host "📦 Applying initial schema..." -ForegroundColor Cyan
        Get-Content "supabase\migrations\20241202_001_initial_schema.sql" | supabase db execute
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Schema applied successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Error applying schema" -ForegroundColor Red
            exit 1
        }
        
        # Apply RLS
        Write-Host "🔒 Applying RLS policies..." -ForegroundColor Cyan
        Get-Content "supabase\migrations\20241202_002_rls_policies.sql" | supabase db execute
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ RLS policies applied successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Error applying RLS policies" -ForegroundColor Red
            exit 1
        }
        
        Write-Host ""
        Write-Host "✅ All migrations applied successfully!" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "📦 Applying initial schema..." -ForegroundColor Cyan
        Get-Content "supabase\migrations\20241202_001_initial_schema.sql" | supabase db execute
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Schema applied successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Error applying schema" -ForegroundColor Red
            exit 1
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "🔒 Applying RLS policies..." -ForegroundColor Cyan
        Get-Content "supabase\migrations\20241202_002_rls_policies.sql" | supabase db execute
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ RLS policies applied successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Error applying RLS policies" -ForegroundColor Red
            exit 1
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "🌱 Applying seed data..." -ForegroundColor Cyan
        Get-Content "supabase\seeds\seed.sql" | supabase db execute
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Seed data applied successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Error applying seed data" -ForegroundColor Red
            exit 1
        }
    }
    
    "5" {
        Write-Host ""
        Write-Host "🚀 Running complete setup..." -ForegroundColor Yellow
        Write-Host ""
        
        # Apply schema
        Write-Host "📦 Applying initial schema..." -ForegroundColor Cyan
        Get-Content "supabase\migrations\20241202_001_initial_schema.sql" | supabase db execute
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error applying schema" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Schema applied" -ForegroundColor Green
        
        # Apply RLS
        Write-Host "🔒 Applying RLS policies..." -ForegroundColor Cyan
        Get-Content "supabase\migrations\20241202_002_rls_policies.sql" | supabase db execute
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error applying RLS policies" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ RLS policies applied" -ForegroundColor Green
        
        # Apply seeds
        Write-Host "🌱 Applying seed data..." -ForegroundColor Cyan
        Get-Content "supabase\seeds\seed.sql" | supabase db execute
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error applying seed data" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Seed data applied" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "✅ Complete setup finished successfully!" -ForegroundColor Green
    }
    
    "6" {
        Write-Host ""
        Write-Host "🔍 Verifying installation..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check tables
        Write-Host "Checking tables..." -ForegroundColor Yellow
        $query = @"
SELECT 
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public'
GROUP BY schemaname;
"@
        
        $query | supabase db execute
        
        Write-Host ""
        Write-Host "Checking RLS status..." -ForegroundColor Yellow
        $query = @"
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename
LIMIT 10;
"@
        
        $query | supabase db execute
        
        Write-Host ""
        Write-Host "Checking seed data..." -ForegroundColor Yellow
        $query = @"
SELECT 'Churches' as entity, COUNT(*) as count FROM churches
UNION ALL
SELECT 'Plans', COUNT(*) FROM plans
UNION ALL
SELECT 'Members', COUNT(*) FROM members
UNION ALL
SELECT 'Groups', COUNT(*) FROM groups
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'Services', COUNT(*) FROM services;
"@
        
        $query | supabase db execute
        
        Write-Host ""
        Write-Host "✅ Verification complete" -ForegroundColor Green
    }
    
    "0" {
        Write-Host ""
        Write-Host "Goodbye! 👋" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
