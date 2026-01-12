#!/bin/bash

echo "Testing webhook with sample WhatsApp payload..."

curl -X POST https://whatsapp-moments.up.railway.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "id": "ENTRY_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "0658295041",
            "phone_number_id": "940140815849209"
          },
          "messages": [{
            "from": "27123456789",
            "id": "wamid.test123",
            "timestamp": "1640995200",
            "text": {
              "body": "Test message from debug script"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'

echo -e "\n\nWebhook test sent. Check Railway Deploy Logs for processing errors."