#!/bin/bash

echo "🧪 Testing Complete Community Signal Engine"

# Test 1: Community message with MCP moderation
echo "📝 Test 1: Community message with MCP processing"
curl -X POST "http://localhost:3000/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "id": "test_urgent_001",
            "from": "27123456789",
            "type": "text",
            "text": {
              "body": "URGENT: There is a fire at the community center in Soweto. People need help evacuating!"
            },
            "timestamp": "'$(date +%s)'"
          }]
        }
      }]
    }]
  }'

echo -e "\n"

# Test 2: Non-urgent community message
echo "📝 Test 2: Non-urgent community message"
curl -X POST "http://localhost:3000/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "id": "test_normal_001",
            "from": "27987654321",
            "type": "text",
            "text": {
              "body": "New community garden opening this weekend in Johannesburg. Free vegetables for everyone!"
            },
            "timestamp": "'$(date +%s)'"
          }]
        }
      }]
    }]
  }'

echo -e "\n"

# Test 3: Check community vs admin content separation
echo "🔍 Test 3: Content source separation"
echo "Community content:"
curl -s "http://localhost:3000/public/moments?source=community" | jq '.moments[] | {title: .title, source: .content_source}' 2>/dev/null || echo "No community moments"

echo "\nAdmin content:"
curl -s "http://localhost:3000/public/moments?source=admin" | jq '.moments[] | {title: .title, source: .content_source}' 2>/dev/null || echo "No admin moments"

echo -e "\n"

# Test 4: Check PWA filters work
echo "🌐 Test 4: PWA filter functionality"
curl -s "http://localhost:3000/moments" | grep -q "Community Reports" && echo "✅ Community filter found" || echo "❌ Community filter missing"
curl -s "http://localhost:3000/moments" | grep -q "Official Updates" && echo "✅ Admin filter found" || echo "❌ Admin filter missing"

echo -e "\n"

# Test 5: Admin analytics with community stats
echo "📊 Test 5: Enhanced admin analytics"
curl -s "http://localhost:3000/admin/analytics" \
  -H "Authorization: Bearer test_token" | \
  jq '{totalMoments, communityMoments, adminMoments}' 2>/dev/null || echo "Analytics unavailable (auth required)"

echo -e "\n"

# Test 6: N8N integration endpoint
echo "🤖 Test 6: N8N sponsored content trigger"
curl -X POST "http://localhost:3000/admin/n8n-trigger" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "trigger_type": "sponsored_moment",
    "moment_data": {
      "title": "N8N Test Sponsored Moment",
      "content": "This is a test sponsored moment created via N8N automation",
      "region": "GP",
      "category": "Technology",
      "sponsor_id": null
    }
  }' 2>/dev/null && echo "✅ N8N endpoint working" || echo "❌ N8N endpoint failed (auth required)"

echo -e "\n"

# Test 7: Urgency processing
echo "⚡ Test 7: Urgency-based processing"
echo "Check server logs for urgent moment processing..."

echo -e "\n✅ Community Signal Engine tests complete"
echo "\n🔍 Next steps:"
echo "1. Check server logs for MCP processing"
echo "2. Verify WhatsApp broadcasts sent"
echo "3. Check PWA shows both content types"
echo "4. Confirm neutral language in community acknowledgments"