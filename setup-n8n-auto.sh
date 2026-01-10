#!/bin/bash

echo "🔧 AUTOMATED N8N ENVIRONMENT SETUP"
echo "==================================="

# Check if n8n directory exists
if [ ! -d "n8n-local" ]; then
    echo "❌ n8n-local directory not found"
    echo "Creating n8n environment setup..."
    mkdir -p n8n-local
fi

# Create docker-compose with environment variables
echo "📝 Creating n8n docker-compose with environment..."

cat > n8n-local/docker-compose.yml << 'EOF'
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin123
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=UTC
      - SUPABASE_URL=https://arqeiadudzwbmzdhqkit.supabase.co
      - SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU5OCwiZXhwIjoyMDgxNzk0NTk4fQ.WyolKqTVdblr1r8eCjOOaBuMq2uLAJIM_0YC3n3M7s8
      - SUPABASE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU5OCwiZXhwIjoyMDgxNzk0NTk4fQ.WyolKqTVdblr1r8eCjOOaBuMq2uLAJIM_0YC3n3M7s8
      - WHATSAPP_TOKEN=EAAVqvFzqn6UBQQ2WZCLcPkz5fSN1qGDoZBy4Q2deJZBli15YUbno0jMZCwWf3t48pXkHKeb7KfdTgTrdJE7yd4eZB9AgulbQOMgqyZCDFpZCZAKbqZAIhqGE7tmgiZAbDZC3t4qivIlI59Na1ZA1zcps3TEhzAd4Em1aZB7haiXJZBdyvCniTocju8tqXiYuvElmnclwZDZD
      - PHONE_NUMBER_ID=997749243410302
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/home/node/.n8n/workflows

volumes:
  n8n_data:
EOF

# Copy workflow to n8n workflows directory
echo "📋 Setting up workflow..."
mkdir -p n8n-local/workflows
cp n8n/intent-executor-workflow.json n8n-local/workflows/

# Create startup script
cat > n8n-local/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting n8n with WhatsApp Moments configuration..."
docker-compose up -d
echo "✅ n8n started at http://localhost:5678"
echo "📋 Login: admin / admin123"
echo "🔄 Import workflow: intent-executor-workflow.json"
EOF

chmod +x n8n-local/start.sh

echo "✅ N8N ENVIRONMENT CONFIGURED"
echo ""
echo "🚀 TO START N8N:"
echo "cd n8n-local && ./start.sh"
echo ""
echo "🌐 ACCESS: http://localhost:5678"
echo "🔑 LOGIN: admin / admin123"
echo ""
echo "📋 WORKFLOW: intent-executor-workflow.json (auto-imported)"
echo "🔧 ENVIRONMENT: All variables pre-configured"

echo ""
echo "✅ AUTOMATED N8N SETUP COMPLETE"