#!/bin/bash
# Deploy updated Supabase functions

echo "🚀 Deploying updated Supabase functions..."

# Deploy webhook function (updated with enhanced commands)
supabase functions deploy webhook --project-ref bxmdzcxejcxbinghtyfw

echo "✅ Webhook function deployed with enhanced WhatsApp commands"
echo "📱 Commands now available: START, STOP, HELP, REGIONS, INTERESTS"