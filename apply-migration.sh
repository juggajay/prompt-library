#!/bin/bash

# Script to apply PRD Generator Supabase migration

echo "🚀 Applying PRD Generator Migration..."
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    echo "Applying migration..."
    cd "$(dirname "$0")"
    supabase db push
    echo ""
    echo "✅ Migration applied via Supabase CLI"
else
    echo "⚠️  Supabase CLI not found"
    echo ""
    echo "📋 Manual Migration Instructions:"
    echo ""
    echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
    echo "2. Select your project: prompt-library"
    echo "3. Go to SQL Editor"
    echo "4. Click 'New Query'"
    echo "5. Copy and paste the contents of: supabase/migrations/20250312_prd_generator.sql"
    echo "6. Click 'Run' to execute the migration"
    echo ""
    echo "OR install Supabase CLI and run this script again:"
    echo ""
    echo "  npm install -g supabase"
    echo "  supabase login"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo "  ./apply-migration.sh"
    echo ""
    echo "Migration file location:"
    echo "  $(pwd)/supabase/migrations/20250312_prd_generator.sql"
fi
