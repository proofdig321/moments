#!/bin/bash

echo "🚀 Deploying broadcast-webhook function with batch processing..."

# Check if we have the Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Deploy the function
supabase functions deploy broadcast-webhook --project-ref bxmdzcxejcxbinghtyfw

echo "✅ Broadcast webhook deployed with batch processing capabilities"
echo "📊 Features: Batch processing for >50 recipients, 5x faster rate limiting"