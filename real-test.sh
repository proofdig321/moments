#!/bin/bash

echo "🔍 REAL SYSTEM TEST - NO BULLSHIT"
echo "================================="

echo "1. Testing local server health..."
response=$(curl -s -w "%{http_code}" "https://newcodespaces-8080.app.github.dev/health" 2>/dev/null)
status="${response: -3}"
echo "   Status: $status"

echo ""
echo "2. Testing admin dashboard..."
response=$(curl -s -w "%{http_code}" "https://newcodespaces-8080.app.github.dev/admin-dashboard.html" 2>/dev/null)
status="${response: -3}"
echo "   Status: $status"

echo ""
echo "3. Testing Supabase connection..."
node -e "
const https = require('https');
https.get('https://bxmdzxejcxbinghtytfw.supabase.co/rest/v1/', (res) => {
  console.log('   Supabase Status:', res.statusCode);
}).on('error', (e) => {
  console.log('   Supabase Error:', e.message);
});
" 2>&1

echo ""
echo "4. Checking what's actually running..."
ps aux | grep node | grep -v grep | wc -l | xargs echo "   Node processes:"

echo ""
echo "5. Testing if server is listening on port 8080..."
netstat -tlnp 2>/dev/null | grep :8080 || echo "   Port 8080 not listening"

echo ""
echo "CONCLUSION:"
echo "==========="
if [ "$status" = "200" ]; then
    echo "✅ Server is working"
else
    echo "❌ Server is not responding properly"
    echo "   - Either the server isn't running"
    echo "   - Or the Supabase connection is failing"
    echo "   - Or the routes are broken"
fi