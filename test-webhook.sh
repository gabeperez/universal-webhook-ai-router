#!/bin/bash

# Test script for Cal.com webhook integration
# Usage: ./test-webhook.sh [local|prod] [webhook_secret]

MODE=${1:-"local"}
WEBHOOK_SECRET=${2}

if [[ "$MODE" == "local" ]]; then
    URL="http://127.0.0.1:8787"
elif [[ "$MODE" == "prod" ]]; then
    URL="https://cal-webhook.perez-jg22.workers.dev"
else
    echo "Usage: $0 [local|prod] [webhook_secret]"
    exit 1
fi

# Sample Cal.com webhook payload
BODY='{
  "triggerEvent": "BOOKING_CREATED",
  "createdAt": "2025-09-14T15:30:00.000Z",
  "payload": {
    "uid": "abc123",
    "id": 123456,
    "title": "30 min meeting",
    "description": "Quick sync meeting",
    "startTime": "2025-09-14T16:00:00.000Z",
    "endTime": "2025-09-14T16:30:00.000Z",
    "status": "ACCEPTED",
    "organizer": {
      "id": 1,
      "name": "Gabe Perez",
      "email": "gabe@example.com",
      "timeZone": "America/New_York"
    },
    "attendees": [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "timeZone": "America/New_York"
      }
    ],
    "eventTypeId": 789,
    "location": "Zoom",
    "metadata": {
      "note": "Please prepare agenda"
    }
  }
}'

echo "Testing Cal.com webhook integration..."
echo "Mode: $MODE"
echo "URL: $URL"
echo ""

# Test health endpoint first
echo "1. Testing health endpoint..."
curl -s "$URL/health" | jq .
echo ""

if [[ -n "$WEBHOOK_SECRET" ]]; then
    # Generate HMAC-SHA256 signature
    echo "2. Testing webhook with signature verification..."
    SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | cut -d" " -f2)
    echo "Generated signature: $SIG"
    
    curl -X POST "$URL/" \
        -H "Content-Type: application/json" \
        -H "cal-signature: $SIG" \
        -d "$BODY" \
        -s | jq .
else
    echo "2. Testing webhook without signature (should work if CAL_WEBHOOK_SECRET not set)..."
    curl -X POST "$URL/" \
        -H "Content-Type: application/json" \
        -d "$BODY" \
        -s | jq .
fi

echo ""
echo "Test completed!"