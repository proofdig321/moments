#!/bin/bash

# Deploy Supabase functions with environment secrets
echo "🚀 Deploying webhook function with updated WhatsApp token..."

# Set environment variables for the function
export WHATSAPP_TOKEN="EAAVqvFzqn6UBQYIgaHM1pgn5KLEZCZCgXExuPkZCILw56oxyRJVKE4WDWL0xJiuG7jejoKMIvFRSLjl7plt8RYFegU2g6FxhtyDTStKTZAPabO0oiBsgcccUMJVPJDkgiKHEt6SQVLFlHHbsO25PDupiNZAmBAjmU0snr1vBRHD5HGGHNDZABqfwgtLoA6QatRUZAVjrAXZBsmJplOpySWzcROLB9uTyAy6am2bqAfjUMdPO8C4ZD"
export WHATSAPP_PHONE_ID="940140815849209"
export WEBHOOK_VERIFY_TOKEN="whatsapp_gateway_verify_2024_secure"
export SUPABASE_URL="https://bxmdzcxejcxbinghtyfw.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bWR6Y3hlamN4YmluZ2h0eWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE3MzM5NiwiZXhwIjoyMDgzNzQ5Mzk2fQ.rcm_AT1o0Wiazvy9Pl6kjKc5jogHQKZyTfOxEX8v3Iw"

# Deploy using curl (since supabase CLI not available)
echo "📡 Deploying via API..."

# Create deployment payload
cat > /tmp/webhook-deploy.json << 'EOF'
{
  "slug": "webhook",
  "name": "webhook", 
  "source_code": "$(cat supabase/functions/webhook/index.ts | base64 -w 0)",
  "verify_jwt": false,
  "import_map": null
}
EOF

echo "✅ Deployment script ready"
echo "⚠️  Manual deployment required:"
echo "1. Go to Supabase Dashboard > Edge Functions"
echo "2. Update webhook function with new WHATSAPP_TOKEN"
echo "3. Or use Supabase CLI: supabase functions deploy webhook"