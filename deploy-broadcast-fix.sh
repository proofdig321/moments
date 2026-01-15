#!/bin/bash

# Broadcast Webhook Production Fix Deployment
# This script deploys the fixed broadcast-webhook and admin-api functions

set -e  # Exit on error

echo "📦 Broadcast Webhook Production Deployment"
echo "=========================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project reference
PROJECT_REF="bxmdzcxejcxbinghtyfw"
REGION="eu-west-3"

echo -e "${BLUE}ℹ️  Project: ${PROJECT_REF}${NC}"
echo -e "${BLUE}ℹ️  Region: ${REGION}${NC}"
echo ""

# Step 1: Deploy broadcast-webhook
echo -e "${YELLOW}Step 1/2: Deploying broadcast-webhook function...${NC}"
cd /workspaces/moments/supabase/functions/broadcast-webhook

echo "📤 Uploading broadcast-webhook..."
supabase functions deploy broadcast-webhook \
  --project-id "$PROJECT_REF" \
  --region "$REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ broadcast-webhook deployed successfully${NC}"
else
    echo -e "${RED}❌ broadcast-webhook deployment failed${NC}"
    exit 1
fi

echo ""

# Step 2: Deploy admin-api
echo -e "${YELLOW}Step 2/2: Deploying admin-api function...${NC}"
cd /workspaces/moments/supabase/functions/admin-api

echo "📤 Uploading admin-api..."
supabase functions deploy admin-api \
  --project-id "$PROJECT_REF" \
  --region "$REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ admin-api deployed successfully${NC}"
else
    echo -e "${RED}❌ admin-api deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "   - broadcast-webhook: Fixed validation & error handling"
echo "   - admin-api: Enhanced logging for debugging"
echo "   - Both functions deployed to production"
echo ""
echo "🔍 To verify:"
echo "   1. Check function logs: supabase functions logs broadcast-webhook --project-id $PROJECT_REF"
echo "   2. Test broadcast: Create a new moment and check logs for detailed webhook status"
echo "   3. Monitor error_logs table for broadcast webhook failures"
echo ""
echo "📊 Expected behavior:"
echo "   ✓ Broadcasts should now show detailed error messages"
echo "   ✓ 404 errors will be logged with full context"
echo "   ✓ WhatsApp delivery will be retried on failures"
echo ""
