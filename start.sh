#!/bin/bash

echo "Starting WhatsApp Community Gateway..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Run ./setup.sh first."
    exit 1
fi

# Start the server
npm start