# ⚙️ Configuration Guide

## 🔧 After Deployment

Once you've deployed your webhook router, you'll need to configure a few things:

### 1. Update Your Worker Name

Edit `wrangler.jsonc`:
```json
{
  "name": "your-webhook-router-name",  // 👈 Change this
  "main": "src/index.ts",
  "compatibility_date": "2025-09-15"
}
```

### 2. Set Environment Secrets

```bash
# Required: Your AI API key
wrangler secret put AI_API_KEY
# Enter your Poke.com API key when prompted

# Optional: Webhook secrets for signature validation
wrangler secret put CAL_WEBHOOK_SECRET
wrangler secret put GITHUB_WEBHOOK_SECRET
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 3. Get Your Webhook URL

After deployment, your webhook URL will be:
```
https://your-webhook-router-name.your-subdomain.workers.dev
```

### 4. Update Test Script

Edit `test-webhook.sh` line 12:
```bash
URL="https://your-actual-worker-url.workers.dev"
```

### 5. Configure Your Services

Point all your webhook services to your worker URL:

**Cal.com:**
- Go to Settings → Developer → Webhooks
- URL: `https://your-worker-url.workers.dev`
- Secret: Same as your `CAL_WEBHOOK_SECRET`

**GitHub:**
- Go to Repository → Settings → Webhooks
- URL: `https://your-worker-url.workers.dev`
- Secret: Same as your `GITHUB_WEBHOOK_SECRET`

**Stripe:**
- Go to Dashboard → Developers → Webhooks  
- URL: `https://your-worker-url.workers.dev`
- Use your `STRIPE_WEBHOOK_SECRET`

## 🧪 Test Your Setup

```bash
# Test health endpoint
curl https://your-worker-url.workers.dev/health

# Test with sample webhook
./test-webhook.sh prod your-webhook-secret

# Monitor logs
wrangler tail
```

## 🎯 What You'll See

Your AI will receive messages like:
- 📅 "New booking: 'Sales Call' scheduled for 2025-09-15T14:00:00.000Z with John Smith"
- 🔄 "Code pushed to my-project (3 commits)"  
- 💳 "Payment successful: $49.99"

That's it! Your universal webhook router is now forwarding events to your AI! 🎉