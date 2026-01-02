#!/bin/bash

# SQL Syntax Validation Script
# Usage: ./scripts/validate_sql.sh

set -e

echo "🔍 SQL Syntax Validation - Unami Foundation Moments"
echo "=================================================="

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Installing..."
    sudo apt-get update && sudo apt-get install -y postgresql-client
fi

# Validate SQL files
echo "📋 Validating SQL syntax..."

FILES=(
    "supabase/campaigns_review.sql"
    "supabase/rbac.sql" 
    "supabase/test_queries.sql"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Validating $file..."
        # Dry run syntax check
        psql --dry-run -f "$file" 2>/dev/null || {
            echo "❌ Syntax error in $file"
            exit 1
        }
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "✅ All SQL files validated successfully!"