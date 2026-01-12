#!/usr/bin/env bash
set -euo pipefail

# Seed Superadmin Script for Unami Foundation Moments
# Usage:
#   export SUPERADMIN_USER_ID=00000000-0000-0000-0000-000000000000
#   export DATABASE_URL=postgresql://postgres:password@host:5432/dbname
#   ./scripts/seed_superadmin.sh

echo "🔐 Seeding Superadmin for Unami Foundation Moments"
echo "================================================"

# Check required environment variables
if [ -z "${SUPERADMIN_USER_ID:-}" ]; then
  echo "❌ ERROR: SUPERADMIN_USER_ID environment variable is required"
  echo "   Set it to your Supabase Auth user UUID"
  echo "   Example: export SUPERADMIN_USER_ID=12345678-1234-1234-1234-123456789012"
  exit 1
fi

# Validate UUID format
if ! echo "$SUPERADMIN_USER_ID" | grep -qE '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; then
  echo "❌ ERROR: SUPERADMIN_USER_ID must be a valid UUID format"
  echo "   Got: $SUPERADMIN_USER_ID"
  exit 1
fi

# SQL to insert/update superadmin role
SQL_CONTENT="-- Seed superadmin role for Unami Foundation Moments
INSERT INTO public.admin_roles (user_id, role)
VALUES ('${SUPERADMIN_USER_ID}', 'superadmin')
ON CONFLICT (user_id) DO UPDATE SET 
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the role was created
SELECT 
  user_id,
  role,
  created_at,
  updated_at
FROM admin_roles 
WHERE user_id = '${SUPERADMIN_USER_ID}';"

DB_URL="${DATABASE_URL:-}"

echo "👤 User ID: $SUPERADMIN_USER_ID"
echo "🎭 Role: superadmin"
echo ""

# Try different methods to execute SQL
if [ -n "$DB_URL" ]; then
  echo "🔗 Using DATABASE_URL: ${DB_URL%%@*}@***"
  
  # Method 1: Try psql directly
  if command -v psql >/dev/null 2>&1; then
    echo "📊 Executing SQL via psql..."
    if echo "$SQL_CONTENT" | psql "$DB_URL" --set ON_ERROR_STOP=on; then
      echo "✅ Superadmin role seeded successfully!"
      exit 0
    else
      echo "❌ Failed to execute via psql"
    fi
  fi
  
  # Method 2: Try Docker postgres
  if command -v docker >/dev/null 2>&1; then
    echo "🐳 Trying Docker postgres client..."
    if echo "$SQL_CONTENT" | docker run --rm -i postgres:15 psql "$DB_URL" -v ON_ERROR_STOP=1; then
      echo "✅ Superadmin role seeded successfully via Docker!"
      exit 0
    else
      echo "❌ Failed to execute via Docker psql"
    fi
  fi
  
  echo "❌ Could not execute SQL automatically"
else
  echo "ℹ️  No DATABASE_URL provided"
fi

echo ""
echo "📋 Manual Setup Instructions:"
echo "============================="
echo "1. Open your Supabase project SQL Editor"
echo "2. Paste and execute the following SQL:"
echo ""
echo "$SQL_CONTENT"
echo ""
echo "3. Verify the role was created by checking the SELECT result"
echo ""
echo "🔗 Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql"

exit 0
