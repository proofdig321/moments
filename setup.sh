#!/bin/bash

echo "Setting up WhatsApp Community Gateway..."

# Install dependencies
npm install

# Create .env from template
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file - please configure your environment variables"
fi

# Make scripts executable
chmod +x setup.sh
chmod +x start.sh

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure .env with your API keys and endpoints"
echo "2. Run Supabase schema: supabase db reset --db-url YOUR_SUPABASE_URL"
echo "3. Import n8n workflows from n8n/ directory"
echo "4. Start the server: npm start"
echo ""
echo "Webhook URL: http://localhost:3000/webhook"