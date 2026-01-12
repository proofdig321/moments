#!/bin/bash

echo "🧪 Testing Complete Community Page Integration..."

# Test 1: Public API stats
echo "1. Testing public stats endpoint..."
curl -s "https://your-project.supabase.co/functions/v1/public-api/stats" | jq '.'

# Test 2: Public API moments (all content)
echo "2. Testing moments endpoint (all content)..."
curl -s "https://your-project.supabase.co/functions/v1/public-api/moments" | jq '.moments | length'

# Test 3: Filter by region
echo "3. Testing region filter (KZN)..."
curl -s "https://your-project.supabase.co/functions/v1/public-api/moments?region=KZN" | jq '.moments | length'

# Test 4: Filter by source (community only)
echo "4. Testing source filter (community)..."
curl -s "https://your-project.supabase.co/functions/v1/public-api/moments?source=community" | jq '.moments | length'

# Test 5: Filter by source (admin/campaigns)
echo "5. Testing source filter (admin)..."
curl -s "https://your-project.supabase.co/functions/v1/public-api/moments?source=admin" | jq '.moments | length'

echo "✅ Community page integration test complete!"
echo "📱 Visit: https://your-domain.com/moments"