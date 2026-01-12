#!/bin/bash

echo "Testing WhatsApp Gateway Integration..."

# Test MCP endpoint
echo "1. Testing MCP Advisory Service..."
curl -X POST $MCP_ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{
    "message": "urgent help needed",
    "language": "eng", 
    "media_type": "text",
    "from_number": "27123456789",
    "timestamp": "2024-01-01T00:00:00Z"
  }'

echo -e "\n\n2. Testing MCP Health..."
curl $MCP_ENDPOINT/../health

echo -e "\n\n3. Testing Gateway Health..."
curl http://localhost:3000/health

echo -e "\n\n4. Testing Supabase Connection..."
node -e "
import { supabase } from './config/supabase.js';
const test = await supabase.from('messages').select('count').limit(1);
console.log('Supabase:', test.error ? 'ERROR' : 'OK');
"

echo -e "\n\nIntegration test complete."