#!/bin/bash

# Database Migration Script for Unami Foundation Moments
# Usage: ./scripts/apply_migrations.sh "<SUPABASE_DB_URL>"

set -e

DB_URL="$1"

if [ -z "$DB_URL" ]; then
    echo "❌ Error: Database URL required"
    echo "Usage: $0 \"<SUPABASE_DB_URL>\""
    echo "Example: $0 \"postgresql://postgres:password@db.project.supabase.co:5432/postgres\""
    exit 1
fi

echo "🚀 Applying Unami Foundation Moments Database Migration"
echo "=================================================="

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client."
    exit 1
fi

# Apply the safe migration
echo "📋 Applying safe migration..."
if psql "$DB_URL" -f supabase/safe-migration.sql; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🎯 Database Schema Ready:"
    echo "  ✅ sponsors table"
    echo "  ✅ moments table" 
    echo "  ✅ broadcasts table"
    echo "  ✅ subscriptions table"
    echo "  ✅ system_settings table"
    echo "  ✅ Indexes and policies"
    echo "  ✅ Default data inserted"
    echo ""
    echo "🚀 System ready for production!"
else
    echo "❌ Migration failed. Check the error above."
    exit 1
fi