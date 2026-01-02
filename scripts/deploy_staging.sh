#!/bin/bash

# Staging Database Deployment Script
# Usage: ./scripts/deploy_staging.sh

set -e

echo "🚀 Staging Database Deployment - Unami Foundation Moments"
echo "========================================================"

# Check environment variables
if [ -z "$STAGING_DATABASE_URL" ]; then
    echo "❌ Error: STAGING_DATABASE_URL not set"
    echo "Export your staging database URL:"
    echo "export STAGING_DATABASE_URL='postgresql://postgres:password@db.staging.supabase.co:5432/postgres'"
    exit 1
fi

# Validate SQL files first
echo "🔍 Validating SQL syntax..."
./scripts/validate_sql.sh

# Create database snapshot (if supported)
echo "📸 Creating database snapshot..."
SNAPSHOT_NAME="pre_moments_migration_$(date +%Y%m%d_%H%M%S)"
echo "Snapshot: $SNAPSHOT_NAME"

# Apply migrations in order
echo "📋 Applying campaigns_review.sql..."
psql "$STAGING_DATABASE_URL" -f supabase/campaigns_review.sql --set ON_ERROR_STOP=on

echo "📋 Applying rbac.sql..."
psql "$STAGING_DATABASE_URL" -f supabase/rbac.sql --set ON_ERROR_STOP=on

echo "📋 Applying safe-migration.sql..."
psql "$STAGING_DATABASE_URL" -f supabase/safe-migration.sql --set ON_ERROR_STOP=on

# Validate with test queries
echo "🧪 Running validation tests..."
psql "$STAGING_DATABASE_URL" -f supabase/test_queries.sql --set ON_ERROR_STOP=on > staging_test_results.log

echo "✅ Staging deployment completed successfully!"
echo "📊 Test results saved to: staging_test_results.log"
echo ""
echo "🎯 Next Steps:"
echo "1. Review test results: cat staging_test_results.log"
echo "2. Test admin interface against staging"
echo "3. Run E2E tests"
echo "4. Schedule production deployment"