#!/bin/bash
# Quick cron setup script - runs the SQL directly

echo "🔧 Setting up digest cron job..."
echo ""
echo "Copy and paste this into Supabase SQL Editor:"
echo "================================================"
cat supabase/setup-digest-cron.sql
echo "================================================"
echo ""
echo "Or run manually:"
echo "psql \$DATABASE_URL -f supabase/setup-digest-cron.sql"
