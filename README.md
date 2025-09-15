# 🔗 Universal Webhook Router for AI

Transform webhooks from any service (Cal.com, GitHub, Stripe, Shopify, etc.) into natural language notifications for your AI assistant.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/gabeperez/universal-webhook-ai-router)

This CloudFlare Worker receives webhook events from Cal.com and forwards relevant booking information to your AI at poke.com.

## 🚀 Quick Start

### Option 1: One-Click Deploy (Recommended)
1. Click the deploy button above
2. Connect your Cloudflare account
3. Set your `AI_API_KEY` environment variable
4. Your webhook URL: `https://your-worker-name.your-subdomain.workers.dev`

### Option 2: Manual Deploy
```bash
git clone https://github.com/gabeperez/universal-webhook-ai-router
cd universal-webhook-ai-router
npm install
wrangler login
wrangler secret put AI_API_KEY
wrangler deploy
```

📋 **Next Steps**: See [CONFIG.md](CONFIG.md) for post-deployment configuration.

## 📋 Features

- **Secure webhook validation** using HMAC-SHA256 signatures
- **Event filtering** for booking events: `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`, `BOOKING_CONFIRMED`
- **Automatic retry logic** with exponential backoff for Poke.com API calls
- **Comprehensive error handling** and logging
- **Health monitoring** endpoint

## 🔧 Cal.com Configuration

### Step 1: Access Webhook Settings
1. Log into your Cal.com account
2. Navigate to **Settings** → **Developer** → **Webhooks**

### Step 2: Add New Webhook
- **Webhook URL**: `https://cal-webhook.perez-jg22.workers.dev`
- **Secret**: Use the same value as your `CAL_WEBHOOK_SECRET` environment variable
- **Events to Subscribe**: Select the following:
  - ✅ Booking Created
  - ✅ Booking Confirmed  
  - ✅ Booking Cancelled
  - ✅ Booking Rescheduled

### Step 3: Test the Integration
1. Create a test booking in Cal.com
2. Check the CloudFlare Workers dashboard for logs
3. Verify your AI at poke.com receives the notification

## 🔒 Security

- **Signature Verification**: All incoming webhooks are verified using HMAC-SHA256
- **Secret Management**: API keys stored securely in CloudFlare Workers secrets
- **Rate Limiting**: CloudFlare provides built-in DDoS protection
- **HTTPS Only**: All communication encrypted in transit

## 📊 Data Flow

```
Cal.com → [Webhook] → CloudFlare Worker → Poke.com AI
```

### Webhook Payload Structure

The worker transforms Cal.com webhook data into this structure for your AI:

```json
{
  "event": "BOOKING_CREATED",
  "bookingId": 123456,
  "bookingUid": "abc123",
  "title": "30 min meeting",
  "startTime": "2025-09-14T16:00:00.000Z",
  "endTime": "2025-09-14T16:30:00.000Z",
  "status": "ACCEPTED",
  "attendees": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "timeZone": "America/New_York"
    }
  ],
  "organizer": {
    "name": "Gabe Perez",
    "email": "gabe@example.com"
  },
  "metadata": {
    "eventTypeId": 789,
    "rescheduleReason": null,
    "cancelReason": null
  },
  "timestamp": "2025-09-14T15:30:00.000Z"
}
```

## 🧪 Testing

### Health Check
```bash
curl https://cal-webhook.perez-jg22.workers.dev/health
```

### Local Development
```bash
# Start local development server
wrangler dev

# Test with the provided script
./test-webhook.sh local [webhook_secret]
```

### Production Testing
```bash
./test-webhook.sh prod [webhook_secret]
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AI_API_KEY` | Bearer token for Poke.com API | ✅ |
| `CAL_WEBHOOK_SECRET` | Secret for webhook signature verification | ✅ |

## 📈 Monitoring

### CloudFlare Dashboard
- **Real-time Logs**: View at Workers → cal-webhook → Logs
- **Performance Metrics**: Request volume, response times, error rates
- **Usage Analytics**: Bandwidth and request statistics

### Common Log Messages
- `✅ Webhook processed successfully` → Normal operation
- `⚠️ Unsupported event ignored` → Non-booking events (expected)
- `❌ Signature verification failed` → Invalid webhook source
- `❌ Failed to forward to Poke.com` → API connectivity issues

## 🛠️ Troubleshooting

### Common Issues

**1. "Missing cal-signature header"**
- Ensure Cal.com webhook secret is configured
- Verify webhook URL is exactly: `https://cal-webhook.perez-jg22.workers.dev`

**2. "Invalid signature"**
- Double-check `CAL_WEBHOOK_SECRET` matches Cal.com configuration
- Ensure secret doesn't have extra whitespace

**3. "Failed to forward to Poke.com"**
- Verify `AI_API_KEY` is valid and active
- Check if Poke.com API is accessible
- Review CloudFlare Worker logs for specific error details

### Debug Commands
```bash
# View worker logs in real-time
wrangler tail

# Check secret configuration
wrangler secret list

# Test health endpoint
curl https://cal-webhook.perez-jg22.workers.dev/health
```

## 📞 Support

For issues with this integration:
1. Check CloudFlare Workers logs first
2. Verify Cal.com webhook configuration
3. Test with the provided test script
4. Review this README for common solutions

---

**Last Updated**: September 14, 2025  
**Worker Version**: 1.0  
**Compatibility**: Cal.com API v1, CloudFlare Workers